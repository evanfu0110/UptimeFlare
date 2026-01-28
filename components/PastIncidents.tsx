import { MonitorState, MonitorTarget } from '@/types/config'
import { Card, Container, Text, Timeline, Badge, Group } from '@mantine/core'
import { IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'

interface IncidentEvent {
    id: string
    time: number
    type: 'down' | 'up' | 'info'
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

    // Iterate over all monitors to collect events
    monitors.forEach((monitor) => {
        const monitorIncidents = state.incident[monitor.id]
        if (!monitorIncidents) return

        monitorIncidents.forEach((incident) => {
            // Add error events
            incident.error.forEach((errorMsg, index) => {
                const time = incident.start[index]
                events.push({
                    id: `${monitor.id}-${time}-error`,
                    time: time,
                    type: 'down',
                    monitorName: monitor.name,
                    message: errorMsg,
                })
            })

            // Add recovery event if it exists
            if (incident.end) {
                events.push({
                    id: `${monitor.id}-${incident.end}-up`,
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

    // Filter out events older than 30? or just show all? 
    // Maybe show recent 20 for cleaner UI
    const displayEvents = events.slice(0, 20)

    if (displayEvents.length === 0) return null

    // Group by date
    const groupedEvents: { [key: string]: IncidentEvent[] } = {}
    displayEvents.forEach((event) => {
        const date = new Date(event.time * 1000).toLocaleDateString()
        if (!groupedEvents[date]) {
            groupedEvents[date] = []
        }
        groupedEvents[date].push(event)
    })

    return (
        <Container size="md" mt="xl" mb="xl">
            <Text size="xl" fw={700} mb="md" ta="center">
                {t('Recent Events')}
            </Text>
            <Card padding="xl" radius="lg" shadow="sm" withBorder style={{ maxWidth: '865px', margin: '0 auto' }}>
                <Timeline active={displayEvents.length} bulletSize={24} lineWidth={2}>
                    {Object.keys(groupedEvents).map((date) => (
                        <div key={date}>
                            <Text size="sm" c="dimmed" mb="sm" mt="md" fw={700} tt="uppercase">
                                {date}
                            </Text>
                            {groupedEvents[date].map((event) => (
                                <Timeline.Item
                                    key={event.id}
                                    bullet={
                                        event.type === 'down' ? (
                                            <IconAlertCircle size={12} />
                                        ) : (
                                            <IconCircleCheck size={12} />
                                        )
                                    }
                                    color={event.type === 'down' ? 'red' : 'teal'}
                                    title={
                                        <Group justify="space-between">
                                            <Text fw={500} size="sm">{event.monitorName}</Text>
                                            <Text size="xs" c="dimmed">
                                                {new Date(event.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </Group>
                                    }
                                >
                                    <Text c="dimmed" size="sm">
                                        {event.message}
                                    </Text>
                                </Timeline.Item>
                            ))}
                        </div>
                    ))}
                </Timeline>
            </Card>
        </Container>
    )
}
