import { MonitorState, MonitorTarget } from '@/types/config'
import { Card, Container, Text, Badge, Group, Stack, ThemeIcon, Box } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface IncidentEvent {
    id: string
    time: number
    type: 'down' | 'up'
    monitorName: string
    message: string
    incidentId: string // To link down/up events
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

    const events: IncidentEvent[] = []

    // Ensure monitors and state exist
    if (!monitors || !state || !state.incident) return null

    // Iterate over all monitors to collect events
    monitors.forEach((monitor) => {
        const monitorIncidents = state.incident[monitor.id]
        if (!monitorIncidents || monitorIncidents.length === 0) return

        monitorIncidents.forEach((incident, incIdx) => {
            const incidentId = `${monitor.id}-${incident.start[0]}`
            // Add error events (the moments it went down or state changed)
            if (incident.error && incident.error.length > 0) {
                incident.error.forEach((errorMsg, errIdx) => {
                    const time = incident.start[errIdx]
                    if (time) {
                        events.push({
                            id: `${monitor.id}-${time}-down-${incIdx}-${errIdx}`,
                            time: time,
                            type: 'down',
                            monitorName: monitor.name,
                            message: translateError(errorMsg) || t('Service unavailable'),
                            incidentId: incidentId,
                        })
                    }
                })
            }

            // Add recovery event if it exists
            if (incident.end) {
                events.push({
                    id: `${monitor.id}-${incident.end}-up-${incIdx}`,
                    time: incident.end,
                    type: 'up',
                    monitorName: monitor.name,
                    message: t('Service restored'),
                    incidentId: incidentId,
                })
            }
        })
    })

    // Sort events by time descending
    events.sort((a, b) => b.time - a.time)

    // Show recent 30 for cleaner UI
    const displayEvents = events.slice(0, 30)

    // Group by date
    const groupedEvents: { [key: string]: IncidentEvent[] } = {}
    displayEvents.forEach((event) => {
        const date = new Date(event.time * 1000).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        if (!groupedEvents[date]) {
            groupedEvents[date] = []
        }
        groupedEvents[date].push(event)
    })

    const dates = Object.keys(groupedEvents)

    return (
        <Container size="md" mt="xl" mb="xl">
            <TitleSection title={t('Recent Events')} />

            {dates.length === 0 ? (
                <Card padding="xl" radius="lg" shadow="sm" withBorder style={{ maxWidth: '865px', margin: '0 auto', textAlign: 'center' }}>
                    <Text c="dimmed">{t('No recent events')}</Text>
                </Card>
            ) : (
                <Stack gap="xl" style={{ maxWidth: '865px', margin: '0 auto' }}>
                    {dates.map((date) => (
                        <Box key={date}>
                            <Text size="sm" c="dimmed" mb="sm" ml="md" fw={700}>
                                {date}
                            </Text>
                            <div style={{ position: 'relative' }}>
                                <Stack gap="xs">
                                    {groupedEvents[date].map((event, idx) => {
                                        const hasUp = event.type === 'down' && groupedEvents[date].some(e => e.type === 'up' && e.incidentId === event.incidentId);
                                        const isLinkedToNext = idx > 0 && groupedEvents[date][idx - 1].incidentId === event.incidentId;

                                        return (
                                            <Box key={event.id} style={{ position: 'relative', marginBottom: '16px' }}>
                                                {/* Stack background layers (only for the last card of a group or for individual cards to look "stacked") */}
                                                {/* Actually, vps.2x.nz does it for the whole section if it's a "stack" */}
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '-4px',
                                                    left: '4px',
                                                    right: '4px',
                                                    height: '10px',
                                                    backgroundColor: '#111318',
                                                    border: '1px solid #21242d',
                                                    borderTop: 'none',
                                                    borderRadius: '0 0 12px 12px',
                                                    zIndex: 1,
                                                    opacity: 0.6
                                                }} />
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '-8px',
                                                    left: '8px',
                                                    right: '8px',
                                                    height: '10px',
                                                    backgroundColor: '#111318',
                                                    border: '1px solid #21242d',
                                                    borderTop: 'none',
                                                    borderRadius: '0 0 12px 12px',
                                                    zIndex: 0,
                                                    opacity: 0.3
                                                }} />

                                                <Card
                                                    component="a"
                                                    href={`/incident/${event.incidentId}`}
                                                    padding="md"
                                                    radius="md"
                                                    withBorder
                                                    shadow="xs"
                                                    style={{
                                                        backgroundColor: '#111318',
                                                        borderColor: '#21242d',
                                                        position: 'relative',
                                                        zIndex: 2,
                                                        textDecoration: 'none',
                                                        display: 'block'
                                                    }}
                                                >
                                                    <Group justify="space-between">
                                                        <Group gap="sm">
                                                            <div style={{ position: 'relative' }}>
                                                                <ThemeIcon
                                                                    color={event.type === 'down' ? '#ef4444' : '#10b981'}
                                                                    variant="light"
                                                                    bg={event.type === 'down' ? '#ef444420' : '#10b98120'}
                                                                    radius="xl"
                                                                    style={{ position: 'relative', zIndex: 10 }}
                                                                >
                                                                    {event.type === 'down' ? <IconAlertCircle size={16} /> : <IconCircleCheck size={16} />}
                                                                </ThemeIcon>

                                                                {/* Connectivity Line */}
                                                                {((event.type === 'down' && hasUp) || (event.type === 'up' && isLinkedToNext)) && (
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: event.type === 'down' ? '100%' : '-100%',
                                                                        left: '50%',
                                                                        width: '2px',
                                                                        height: '40px',
                                                                        backgroundColor: '#21242d',
                                                                        transform: 'translateX(-50%)',
                                                                        zIndex: 5
                                                                    }} />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <Text fw={600} size="sm" c="#ffffff">
                                                                    {event.monitorName} {event.type === 'down' ? '检测到故障' : '服务已恢复正常'}
                                                                </Text>
                                                                <Text size="xs" c="#8a91a5">
                                                                    {event.message}
                                                                </Text>
                                                            </div>
                                                        </Group>
                                                        <Badge
                                                            variant="dot"
                                                            color={event.type === 'down' ? '#ef4444' : '#10b981'}
                                                            size="sm"
                                                            style={{ color: '#8a91a5' }}
                                                        >
                                                            {new Date(event.time * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                                        </Badge>
                                                    </Group>
                                                </Card>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                                {dates.length > 0 && (
                                    <Center mt="xl">
                                        <Text
                                            component="a"
                                            href="/incidents"
                                            size="sm"
                                            c="#8a91a5"
                                            style={{
                                                cursor: 'pointer',
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                        >
                                            以前的更新
                                        </Text>
                                    </Center>
                                )}
                            </div>
                        </Box>
                    ))}
                </Stack>
            )}
        </Container>
    )
}

function TitleSection({ title }: { title: string }) {
    return (
        <Box mb="lg">
            <Text size="xl" fw={700} ta="center">
                {title}
            </Text>
            <Center>
                <Box
                    style={{
                        height: '3px',
                        width: '40px',
                        backgroundColor: 'var(--mantine-color-teal-6)',
                        borderRadius: '2px',
                        marginTop: '4px'
                    }}
                />
            </Center>
        </Box>
    )
}

import { Title as MantineTitle, Center } from '@mantine/core'
