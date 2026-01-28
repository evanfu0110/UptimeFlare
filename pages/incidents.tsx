import Head from 'next/head'

import { Inter } from 'next/font/google'
import { MaintenanceConfig, MonitorState, MonitorTarget } from '@/types/config'
import { pageConfig, workerConfig } from '@/uptime.config'
import Header from '@/components/Header'
import { Box, Button, Center, Container, Group, Select, Text, Stack, Title, Badge } from '@mantine/core'
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

interface IncidentEvent {
  id: string
  time: number
  type: 'downtime' | 'restored'
  monitorName: string
  message: string
  incidentId: string
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

function filterEventsByMonth(
  state: MonitorState,
  monitors: MonitorTarget[],
  monthStr: string
): IncidentEvent[] {
  const events: IncidentEvent[] = []

  monitors.forEach((monitor) => {
    const monitorIncidents = state.incident[monitor.id]
    if (!monitorIncidents) return

    monitorIncidents.forEach((incident) => {
      const incidentId = `${monitor.id}-${incident.start[0]}`

      // Handle each error slice in an incident
      incident.error.forEach((errorMsg, idx) => {
        const startTime = incident.start[idx]
        const d = new Date(startTime * 1000)
        const incidentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')

        if (incidentMonth === monthStr) {
          events.push({
            id: `${monitor.id}-${startTime}-down`,
            type: 'downtime',
            time: startTime,
            monitorName: monitor.name,
            message: translateError(errorMsg),
            incidentId: incidentId,
          })
        }
      })

      if (incident.end) {
        const d = new Date(incident.end * 1000)
        const incidentMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
        if (incidentMonth === monthStr) {
          events.push({
            id: `${monitor.id}-${incident.end}-up`,
            type: 'restored',
            time: incident.end,
            monitorName: monitor.name,
            message: '服务已恢复正常',
            incidentId: incidentId,
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
        <Center mt="xl" pb="xl">
          <Container size="md" style={{ width: '100%' }}>
            <Title size="h2" mb="xl" ta="center" fw={700}>
              全量故障历史
            </Title>

            <Group justify="space-between" mb="md">
              <Group gap="xs">
                <Button variant="default" size="xs" radius="md" onClick={() => {
                  window.location.hash = prev
                  setSelectedMonth(prev)
                }}>
                  {t('Backwards')}
                </Button>
                <Badge variant="light" size="lg" radius="md" color="teal">{selectedMonth}</Badge>
                <Button variant="default" size="xs" radius="md" onClick={() => {
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
                radius="md"
                style={{ width: 220 }}
              />
            </Group>

            <Stack gap="xs">
              {monitorFilteredEvents.length === 0 ? (
                <Card padding="xl" radius="lg" shadow="sm" withBorder style={{ backgroundColor: '#111318', borderColor: '#21242d', textAlign: 'center' }}>
                  <Text c="#8a91a5">{t('No data available')}</Text>
                </Card>
              ) : (
                monitorFilteredEvents.map((event, idx) => {
                  const hasUp = event.type === 'downtime' && monitorFilteredEvents.some(e => e.type === 'restored' && e.incidentId === event.incidentId);
                  const isLinkedToNext = idx > 0 && monitorFilteredEvents[idx - 1].incidentId === event.incidentId;

                  return (
                    <Box key={event.id} style={{ position: 'relative', marginBottom: '16px' }}>
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
                        padding="md"
                        radius="md"
                        withBorder
                        shadow="xs"
                        style={{
                          backgroundColor: '#111318',
                          borderColor: '#21242d',
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        <Group justify="space-between">
                          <Group gap="sm">
                            <div style={{ position: 'relative' }}>
                              <ThemeIcon
                                color={event.type === 'downtime' ? '#ef4444' : '#10b981'}
                                variant="light"
                                bg={event.type === 'downtime' ? '#ef444420' : '#10b98120'}
                                radius="xl"
                                style={{ position: 'relative', zIndex: 10 }}
                              >
                                {event.type === 'downtime' ? <IconAlertCircle size={16} /> : <IconCircleCheck size={16} />}
                              </ThemeIcon>

                              {((event.type === 'downtime' && hasUp) || (event.type === 'restored' && isLinkedToNext)) && (
                                <div style={{
                                  position: 'absolute',
                                  top: event.type === 'downtime' ? '100%' : '-100%',
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
                                {event.monitorName} {event.type === 'downtime' ? '检测到故障' : '服务已恢复正常'}
                              </Text>
                              {event.message && (
                                <Text size="xs" c="#8a91a5">
                                  {event.message}
                                </Text>
                              )}
                            </div>
                          </Group>
                          <Text size="xs" c="#8a91a5" fw={500}>
                            {new Date(event.time * 1000).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </Group>
                      </Card>
                    </Box>
                  )
                })
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

