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

    allEvents.sort((a, b) => b.time - a.time)

    // Group by IncidentId to find latest per incident
    const incidentGroups: { [key: string]: IncidentEvent[] } = {}
    allEvents.slice(0, 50).forEach(event => {
        if (!incidentGroups[event.incidentId]) incidentGroups[event.incidentId] = []
        incidentGroups[event.incidentId].push(event)
    })

    // Group by Date for display
    const dateGroups: { dateLabel: string; incidents: { latest: IncidentEvent; count: number }[] }[] = []

    Object.values(incidentGroups).forEach(events => {
        const latest = events[0]
        const d = new Date(latest.time * 1000)
        const dateLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`

        let dateGroup = dateGroups.find(dg => dg.dateLabel === dateLabel)
        if (!dateGroup) {
            dateGroup = { dateLabel, incidents: [] }
            dateGroups.push(dateGroup)
        }
        dateGroup.incidents.push({ latest, count: events.length })
    })

    // Sort dates desc
    dateGroups.sort((a, b) => {
        const parse = (s: string) => {
            const m = s.match(/(\d+)年(\d+)月(\d+)日/);
            return m ? new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])).getTime() : 0;
        };
        return parse(b.dateLabel) - parse(a.dateLabel);
    });

    return (
        <Container size="md" mt={48} mb={80}>
            <Text fw={700} ta="center" size="32px" mb={48} style={{ letterSpacing: '-0.4px' }}>以前的事件</Text>

            {dateGroups.length === 0 ? (
                <Box bg="rgb(18, 20, 26)" p={40} style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                    <Group justify="center" gap="xs" style={{ color: 'rgb(138, 145, 165)' }}>
                        <IconCircleCheck size={18} />
                        <Text size="15px" fw={500}>没有报告事件</Text>
                    </Group>
                </Box>
            ) : (
                <Stack gap={40}>
                    {dateGroups.map((group, gIdx) => (
                        <Box key={gIdx}>
                            <Text size="13px" fw={500} c="rgb(138, 145, 165)" mb={16}>{group.dateLabel}</Text>
                            <Stack gap={16}>
                                {group.incidents.map((incident, iIdx) => (
                                    <Box key={iIdx} component="a" href={`/incident/${incident.latest.incidentId}`} style={{ textDecoration: 'none', display: 'block' }}>
                                        <Group justify="space-between" mb={12}>
                                            <Text fw={700} size="15px" c="#ffffff">{incident.latest.monitorName} detection failure</Text>
                                            <Badge variant="filled" bg="rgba(239, 68, 68, 0.1)" c="#EF4444" radius="xl" size="sm" fw={700} style={{ textTransform: 'none' }}>停机</Badge>
                                        </Group>

                                        <Box style={{ position: 'relative' }}>
                                            {incident.count > 1 && (
                                                <>
                                                    <div style={{ position: 'absolute', bottom: '-4px', left: '4px', right: '4px', height: '10px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 0 8px 8px', zIndex: 0 }} />
                                                    <div style={{ position: 'absolute', bottom: '-8px', left: '8px', right: '8px', height: '10px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 0 8px 8px', zIndex: -1 }} />
                                                </>
                                            )}

                                            <Box p="md" bg="rgba(255, 255, 255, 0.03)" style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', zIndex: 1 }}>
                                                <Group gap="sm" align="flex-start" wrap="nowrap">
                                                    <ThemeIcon size={18} variant="transparent" color={incident.latest.type === 'up' ? '#10b981' : '#ef4444'} mt={2}>
                                                        {incident.latest.type === 'up' ? <IconCircleCheck size={18} /> : <IconAlertCircle size={18} />}
                                                    </ThemeIcon>
                                                    <Stack gap={2}>
                                                        <Text size="13px" fw={600} c="#ffffff">{incident.latest.type === 'up' ? '已解决' : '检测到故障'} {new Date(incident.latest.time * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} UTC+8</Text>
                                                        <Text size="13px" c="rgb(138, 145, 165)">{incident.latest.message}</Text>
                                                    </Stack>
                                                </Group>
                                            </Box>

                                            {incident.count > 1 && (
                                                <Group gap="sm" mt={16} ml={2}>
                                                    <Box style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px dotted rgb(138, 145, 165)' }} />
                                                    <Text size="13px" fw={500} c="rgb(138, 145, 165)">多于之前的 {incident.count - 1} 次更新</Text>
                                                </Group>
                                            )}
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    ))}

                    <Box component="a" href="/incidents" style={{ textAlign: 'center', marginTop: '16px', textDecoration: 'none' }}>
                        <Text size="13px" fw={500} c="rgb(138, 145, 165)">以前的事件</Text>
                    </Box>
                </Stack>
            )}
        </Container>
    )
}
