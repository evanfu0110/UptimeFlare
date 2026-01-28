import { MonitorState, MonitorTarget } from '@/types/config'
import { Container, Text, Badge, Group, Stack, ThemeIcon, Box } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface IncidentEvent {
    id: string
    time: number
    type: 'down' | 'up'
    monitorName: string
    message: string
    incidentId: string
    monitorId: string
}

interface GroupedIncident {
    time: number
    type: 'down' | 'up'
    monitors: { id: string; name: string; type: 'down' | 'up'; message: string; incidentId: string }[]
    // For stacking effect, we use the max updates among aggregated monitors
    maxUpdates: number
}

function translateError(msg: string): string {
    if (!msg) return ''
    if (msg.includes('timed out')) return '请求超时 (Timed out)'
    if (msg.includes('fetch failed')) return '抓取失败 (Fetch failed)'
    if (msg.includes('connection reset')) return '连接重置 (Connection reset)'
    if (msg.includes('ECONNREFUSED')) return '拒绝连接 (Connection refused)'
    if (msg.includes('404')) return '页面未找到 (404 Not Found)'
    if (msg.includes('500')) return '服务器内部错误 (500 Internal Error)'
    if (msg.includes('502')) return '网关错误 (502 Bad Gateway)'
    if (msg.includes('503')) return '服务不可用 (503 Service Unavailable)'
    return msg
}

export default function PastIncidents({
    monitors,
    state,
}: {
    monitors: MonitorTarget[]
    state: MonitorState
}) {
    const { t } = useTranslation('common')

    if (!monitors || !state || !state.incident) return null

    // 1. Collect all raw events
    const allEvents: IncidentEvent[] = []
    monitors.forEach(monitor => {
        const monitorIncidents = state.incident[monitor.id] || []
        monitorIncidents.forEach(incident => {
            const incidentId = `${monitor.id}-${incident.start[0]}`
            incident.error.forEach((errorMsg, idx) => {
                const startTime = incident.start[idx]
                allEvents.push({
                    id: `${monitor.id}-${startTime}-down`,
                    time: startTime,
                    type: 'down',
                    monitorName: monitor.name,
                    message: translateError(errorMsg),
                    incidentId,
                    monitorId: monitor.id
                })
            })
            if (incident.end) {
                allEvents.push({
                    id: `${monitor.id}-${incident.end}-up`,
                    time: incident.end,
                    type: 'up',
                    monitorName: monitor.name,
                    message: '服务已恢复正常',
                    incidentId,
                    monitorId: monitor.id
                })
            }
        })
    })

    // 2. Sort by time descending
    allEvents.sort((a, b) => b.time - a.time)

    // 3. Group by EXACT Time -> Unique Incident Card
    const dateSections: { dateLabel: string; incidents: GroupedIncident[] }[] = []

    allEvents.forEach(event => {
        const d = new Date(event.time * 1000)
        const dateLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`

        let section = dateSections.find(s => s.dateLabel === dateLabel)
        if (!section) {
            section = { dateLabel, incidents: [] }
            dateSections.push(section)
        }

        // Group by Time
        let grouped = section.incidents.find(gi => gi.time === event.time)
        if (!grouped) {
            grouped = {
                time: event.time,
                type: event.type,
                monitors: [],
                maxUpdates: 0
            }
            section.incidents.push(grouped)
        }

        // Track unique monitors down at this exact time
        if (!grouped.monitors.find(m => m.id === event.monitorId)) {
            const monitorIncidentCount = (state.incident[event.monitorId]?.find(inc => `${event.monitorId}-${inc.start[0]}` === event.incidentId)?.error?.length || 0) +
                (state.incident[event.monitorId]?.find(inc => `${event.monitorId}-${inc.start[0]}` === event.incidentId)?.end ? 1 : 0);

            grouped.monitors.push({
                id: event.monitorId,
                name: event.monitorName,
                type: event.type,
                message: event.message,
                incidentId: event.incidentId
            })

            if (monitorIncidentCount > grouped.maxUpdates) {
                grouped.maxUpdates = monitorIncidentCount;
            }
        }
    })

    // 4. Homepage: Only show the ONE most recent DATE section
    const displaySections = dateSections.slice(0, 1)

    return (
        <Container size="md" mt={48} mb={80}>
            <Text fw={700} ta="center" size="32px" mb={48} style={{ letterSpacing: '-0.4px', color: '#ffffff' }}>以前的事件</Text>

            {displaySections.length === 0 ? (
                <Box bg="rgb(18, 20, 26)" p={40} style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                    <Group justify="center" gap="xs" style={{ color: 'rgb(138, 145, 165)' }}>
                        <IconCircleCheck size={18} />
                        <Text size="15px" fw={500}>没有报告事件</Text>
                    </Group>
                </Box>
            ) : (
                <Stack gap={40}>
                    {displaySections.map((section, sIdx) => (
                        <Box key={sIdx}>
                            <Text size="13px" fw={500} c="rgb(138, 145, 165)" mb={16} ml={4}>{section.dateLabel}</Text>
                            <Stack gap={16}>
                                {section.incidents.map((incident, iIdx) => (
                                    <Box key={iIdx} component="a" href={`/incident/${incident.monitors[0].incidentId}`} style={{ textDecoration: 'none', display: 'block' }}>
                                        <Box style={{ position: 'relative' }}>
                                            {/* Stacking effect based on max history updates among aggregated services */}
                                            {incident.maxUpdates > 1 && (
                                                <>
                                                    <div style={{ position: 'absolute', bottom: '-4px', left: '8px', right: '8px', height: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 0 16px 16px', zIndex: 0 }} />
                                                    <div style={{ position: 'absolute', bottom: '-8px', left: '16px', right: '16px', height: '10px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 0 16px 16px', zIndex: -1 }} />
                                                </>
                                            )}

                                            <Box p="md" bg="rgb(22, 24, 30)" style={{ borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', zIndex: 1 }}>
                                                <Group justify="space-between" mb={14}>
                                                    <Group gap="xs">
                                                        {monitors.find(m => m.id === incident.monitors[0].id)?.icon && (
                                                            <img
                                                                src={monitors.find(m => m.id === incident.monitors[0].id)?.icon}
                                                                style={{ width: '18px', height: '18px', borderRadius: '4px' }}
                                                                alt=""
                                                            />
                                                        )}
                                                        <Text fw={700} size="15px" c="#ffffff">
                                                            {incident.monitors.length > 1 ? `${incident.monitors.length} 个服务检测到异常` : `${incident.monitors[0].name} 检测到故障`}
                                                        </Text>
                                                    </Group>
                                                    <Badge variant="filled" bg="rgba(239, 68, 68, 0.1)" c="#EF4444" radius="xl" size="sm" fw={700} style={{ textTransform: 'none' }}>停机</Badge>
                                                </Group>

                                                <Group gap="sm" align="flex-start" wrap="nowrap">
                                                    <ThemeIcon size={18} variant="transparent" color={incident.type === 'up' ? '#10b981' : '#ef4444'} mt={2}>
                                                        {incident.type === 'up' ? <IconCircleCheck size={18} /> : <IconAlertCircle size={18} />}
                                                    </ThemeIcon>
                                                    <Stack gap={2}>
                                                        <Text size="13px" fw={600} c="#ffffff">{incident.type === 'up' ? '已解决' : '检测到故障'} {new Date(incident.time * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} UTC+8</Text>
                                                        <Text size="13px" c="rgb(138, 145, 165)">{incident.monitors[0].message}</Text>
                                                    </Stack>
                                                </Group>

                                                {incident.maxUpdates > 1 && (
                                                    <Group gap="sm" mt={16} ml={3}>
                                                        <Box style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px dotted rgb(138, 145, 165)' }} />
                                                        <Text size="13px" fw={500} c="rgb(138, 145, 165)">多于之前的 {incident.maxUpdates - 1} 次更新</Text>
                                                    </Group>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    ))}

                    <Box component="a" href="/incidents" style={{ display: 'block', textAlign: 'center', marginTop: '24px', textDecoration: 'none' }}>
                        <Group justify="center" gap={4}>
                            <IconAlertCircle size={14} style={{ color: 'rgb(138, 145, 165)', opacity: 0.8 }} />
                            <Text size="13px" fw={500} c="rgb(138, 145, 165)">以前的事件</Text>
                        </Group>
                    </Box>
                </Stack>
            )}
        </Container>
    )
}
