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
                            message: errorMsg || t('Service unavailable'),
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
                })
            }
        })
    })

    // Sort events by time descending
    events.sort((a, b) => b.time - a.time)

    // Show recent 20 for cleaner UI
    const displayEvents = events.slice(0, 20)

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
                            <Stack gap="xs">
                                {groupedEvents[date].map((event) => (
                                    <Card key={event.id} padding="md" radius="md" withBorder shadow="xs">
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                <ThemeIcon
                                                    color={event.type === 'down' ? 'red' : 'teal'}
                                                    variant="light"
                                                    radius="xl"
                                                >
                                                    {event.type === 'down' ? <IconAlertCircle size={16} /> : <IconCircleCheck size={16} />}
                                                </ThemeIcon>
                                                <div>
                                                    <Text fw={600} size="sm">
                                                        {event.monitorName} {event.type === 'down' ? '出现了故障' : '已恢复'}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {event.message}
                                                    </Text>
                                                </div>
                                            </Group>
                                            <Badge variant="dot" color={event.type === 'down' ? 'red' : 'teal'} size="sm">
                                                {new Date(event.time * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                            </Badge>
                                        </Group>
                                    </Card>
                                ))}
                            </Stack>
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

