import Head from 'next/head'

import { Inter } from 'next/font/google'
import { MaintenanceConfig, MonitorState, MonitorTarget } from '@/types/config'
import { pageConfig, workerConfig } from '@/uptime.config'
import Header from '@/components/Header'
import { Box, Button, Center, Container, Group, Select, Text, Stack } from '@mantine/core'
import Footer from '@/components/Footer'
import { useEffect, useState } from 'react'
import MaintenanceAlert from '@/components/MaintenanceAlert'
import NoIncidentsAlert from '@/components/NoIncidents'
import { useTranslation } from 'react-i18next'
import { CompactedMonitorStateWrapper, getFromStore } from '@/worker/src/store'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'
import { Card, ThemeIcon } from '@mantine/core'

export const runtime = 'experimental-edge'
const inter = Inter({ subsets: ['latin'] })

interface IncidentPageProps {
  compactedStateStr: string
  monitors: MonitorTarget[]
}

function filterEventsByMonth(
  state: MonitorState,
  monitors: MonitorTarget[],
  monthStr: string
) {
  const events: any[] = []
  const [year, month] = monthStr.split('-').map(Number)

  monitors.forEach((monitor) => {
    const monitorIncidents = state.incident[monitor.id]
    if (!monitorIncidents) return

    monitorIncidents.forEach((incident) => {
      // Handle each error slice in an incident
      incident.error.forEach((errorMsg, idx) => {
        const startTime = incident.start[idx]
        const d = new Date(startTime * 1000)
        const incidentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')

        if (incidentMonth === monthStr) {
          events.push({
            type: 'downtime',
            time: startTime,
            monitorName: monitor.name,
            message: errorMsg,
          })
        }
      })

      if (incident.end) {
        const d = new Date(incident.end * 1000)
        const incidentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
        if (incidentMonth === monthStr) {
          events.push({
            type: 'restored',
            time: incident.end,
            monitorName: monitor.name,
          })
        }
      }
    })
  })

  return events.sort((a, b) => b.time - a.time)
}

export default function IncidentsPage({ compactedStateStr, monitors }: IncidentPageProps) {
  const { t } = useTranslation('common')
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>('')
  const [selectedMonth, setSelectedMonth] = useState('')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (hash && hash.includes('-')) {
      setSelectedMonth(hash)
    } else {
      const now = new Date()
      setSelectedMonth(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'))
    }
  }, [])

  let state = new CompactedMonitorStateWrapper(compactedStateStr).uncompact()

  const filteredEvents = selectedMonth ? filterEventsByMonth(state, monitors, selectedMonth) : []
  const monitorFilteredEvents = selectedMonitor
    ? filteredEvents.filter((e) => monitors.find((m) => m.name === e.monitorName)?.id === selectedMonitor)
    : filteredEvents

  const getPrevNextMonth = (monthStr: string) => {
    if (!monthStr) return { prev: '', next: '' }
    const [year, month] = monthStr.split('-').map(Number)
    const date = new Date(year, month - 1)
    const prev = new Date(date)
    prev.setMonth(prev.getMonth() - 1)
    const next = new Date(date)
    next.setMonth(next.getMonth() + 1)
    return {
      prev: prev.getFullYear() + '-' + String(prev.getMonth() + 1).padStart(2, '0'),
      next: next.getFullYear() + '-' + String(next.getMonth() + 1).padStart(2, '0'),
    }
  }

  const { prev, next } = getPrevNextMonth(selectedMonth)

  const monitorOptions = [
    { value: '', label: t('All') },
    ...monitors.map((monitor) => ({
      value: monitor.id,
      label: monitor.name,
    })),
  ]

  return (
    <>
      <Head>
        <title>{pageConfig.title}</title>
        <link rel="icon" href={pageConfig.favicon ?? '/favicon.ico'} />
      </Head>

      <main className={inter.className}>
        <Header />
        <Center mt="xl">
          <Container size="md" style={{ width: '100%' }}>
            <Title size="h2" mb="xl" ta="center" fw={700}>
              发现故障历史
            </Title>

            <Group justify="space-between" mb="md">
              <Group>
                <Button variant="default" size="xs" onClick={() => {
                  window.location.hash = prev
                  setSelectedMonth(prev)
                }}>
                  {t('Backwards')}
                </Button>
                <Text fw={700}>{selectedMonth}</Text>
                <Button variant="default" size="xs" onClick={() => {
                  window.location.hash = next
                  setSelectedMonth(next)
                }}>
                  {t('Forward')}
                </Button>
              </Group>
              <Select
                placeholder={t('Select monitor')}
                data={monitorOptions}
                value={selectedMonitor}
                onChange={setSelectedMonitor}
                clearable
                style={{ width: 220 }}
              />
            </Group>

            <Stack gap="md">
              {monitorFilteredEvents.length === 0 ? (
                <Card padding="xl" radius="lg" shadow="sm" withBorder style={{ textAlign: 'center' }}>
                  <Text c="dimmed">{t('No data available')}</Text>
                </Card>
              ) : (
                monitorFilteredEvents.map((event, i) => (
                  <Card key={i} padding="md" radius="md" withBorder shadow="xs">
                    <Group justify="space-between">
                      <Group gap="sm">
                        <ThemeIcon
                          color={event.type === 'downtime' ? 'red' : 'teal'}
                          variant="light"
                          radius="xl"
                        >
                          {event.type === 'downtime' ? <IconAlertCircle size={16} /> : <IconCircleCheck size={16} />}
                        </ThemeIcon>
                        <div>
                          <Text fw={600} size="sm">
                            {event.monitorName} {event.type === 'downtime' ? '检测到故障' : '服务已恢复正常'}
                          </Text>
                          {event.message && (
                            <Text size="xs" c="dimmed">
                              {event.message}
                            </Text>
                          )}
                        </div>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {new Date(event.time * 1000).toLocaleString('zh-CN')}
                      </Text>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Container>
        </Center>
        <Footer />
      </main>
    </>
  )
}

export async function getServerSideProps() {
  const compactedStateStr = await getFromStore(process.env as any, 'state')
  const monitors = workerConfig.monitors.map((monitor) => ({
    id: monitor.id,
    name: monitor.name,
  }))
  return { props: { compactedStateStr, monitors } }
}

import { Title } from '@mantine/core'

