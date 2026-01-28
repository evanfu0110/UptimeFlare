import Head from 'next/head'
export const runtime = 'experimental-edge'
import { Inter } from 'next/font/google'
import { MonitorState, MonitorTarget } from '@/types/config'
import { pageConfig, workerConfig } from '@/uptime.config'
import Header from '@/components/Header'
import { Box, Container, Group, Select, Text, Stack, Title, Badge, ThemeIcon } from '@mantine/core'
import Footer from '@/components/Footer'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CompactedMonitorStateWrapper, getFromStore } from '@/worker/src/store'
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react'

const inter = Inter({ subsets: ['latin'] })

interface IncidentEvent {
  id: string
  time: number
  type: 'downtime' | 'restored'
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

export default function IncidentsPage({ compactedStateStr, monitors }: { compactedStateStr: string; monitors: MonitorTarget[] }) {
  const { t } = useTranslation('common')
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>('')

  let state = new CompactedMonitorStateWrapper(compactedStateStr).uncompact()

  const allEvents: IncidentEvent[] = []
  monitors.forEach(monitor => {
    const monitorIncidents = state.incident[monitor.id] || []
    monitorIncidents.forEach(incident => {
      const incidentId = `${monitor.id}-${incident.start[0]}`
      incident.error.forEach((errorMsg, idx) => {
        const startTime = incident.start[idx]
        allEvents.push({
          id: `${monitor.id}-${startTime}-down`,
          type: 'downtime',
          time: startTime,
          monitorName: monitor.name,
          message: translateError(errorMsg),
          incidentId,
          monitorId: monitor.id
        })
      })
      if (incident.end) {
        allEvents.push({
          id: `${monitor.id}-${incident.end}-up`,
          type: 'restored',
          time: incident.end,
          monitorName: monitor.name,
          message: '服务已恢复正常',
          incidentId,
          monitorId: monitor.id
        })
      }
    })
  })

  allEvents.sort((a, b) => b.time - a.time)

  const filteredEvents = selectedMonitor
    ? allEvents.filter(e => e.monitorId === selectedMonitor)
    : allEvents

  // Group events by IncidentId to find the latest state for each incident on a specific day
  const incidentGroups: { [key: string]: IncidentEvent[] } = {}
  filteredEvents.forEach(event => {
    if (!incidentGroups[event.incidentId]) incidentGroups[event.incidentId] = []
    incidentGroups[event.incidentId].push(event)
  })

  // Multi-level Grouping: Year-Month > Date > Unique Incidents
  const monthSections: { monthLabel: string; days: { dateLabel: string; incidents: { latest: IncidentEvent; count: number }[] }[] }[] = []

  Object.values(incidentGroups).forEach(events => {
    const latest = events[0] // Sorted by time desc
    const d = new Date(latest.time * 1000)
    const monthLabel = `${d.getFullYear()}年${d.getMonth() + 1}月`
    const dateLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`

    let monthSection = monthSections.find(m => m.monthLabel === monthLabel)
    if (!monthSection) {
      monthSection = { monthLabel, days: [] }
      monthSections.push(monthSection)
    }

    let daySection = monthSection.days.find(day => day.dateLabel === dateLabel)
    if (!daySection) {
      daySection = { dateLabel, incidents: [] }
      monthSection.days.push(daySection)
    }

    daySection.incidents.push({ latest, count: events.length })
  })

  // Sort sections and days descending
  monthSections.sort((a, b) => {
    const parse = (s: string) => {
      const m = s.match(/(\d+)年(\d+)月/);
      return m ? parseInt(m[1]) * 12 + parseInt(m[2]) : 0;
    };
    return parse(b.monthLabel) - parse(a.monthLabel);
  });

  monthSections.forEach(m => {
    m.days.sort((a, b) => {
      const parse = (s: string) => {
        const m = s.match(/(\d+)年(\d+)月(\d+)日/);
        return m ? new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3])).getTime() : 0;
      };
      return parse(b.dateLabel) - parse(a.dateLabel);
    });
  });

  return (
    <>
      <Head>
        <title>事件 | Cola Monitor</title>
        <link rel="icon" href={pageConfig.favicon ?? '/favicon.ico'} />
      </Head>

      <main className={inter.className}>
        <Header />
        <Container size="md" pb={80}>
          <Title order={1} mt={40} mb={32} ta="center" style={{ fontSize: '32px', letterSpacing: '-0.4px' }}>
            以前的事件
          </Title>

          <Group justify="center" mb={64}>
            <Select
              placeholder="选择监控项"
              data={[{ value: '', label: '全部服务' }, ...monitors.map(m => ({ value: m.id, label: m.name }))]}
              value={selectedMonitor}
              onChange={setSelectedMonitor}
              radius="md"
              style={{ width: 240 }}
            />
          </Group>

          <Stack gap={48}>
            {monthSections.length === 0 ? (
              <Box bg="rgb(18, 20, 26)" p={40} style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                <Group justify="center" gap="xs" style={{ color: 'rgb(138, 145, 165)' }}>
                  <IconCircleCheck size={18} />
                  <Text size="15px" fw={500}>没有报告事件</Text>
                </Group>
              </Box>
            ) : monthSections.map((month, mIdx) => (
              <Box key={mIdx}>
                <Box bg="rgb(18, 20, 26)" p="md" style={{ borderRadius: '8px 8px 0 0', border: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: 'none' }}>
                  <Text fw={700} size="15px">{month.monthLabel}</Text>
                </Box>
                <Stack gap={0} style={{ border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                  {month.days.map((day, dIdx) => (
                    <Box key={dIdx} style={{ borderTop: dIdx === 0 ? 'none' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <Group justify="space-between" p="md" bg="rgb(22, 24, 30)">
                        <Text size="13px" fw={500} c="rgb(138, 145, 165)">{day.dateLabel}</Text>
                        <Text size="13px" fw={500} c="rgb(138, 145, 165)">{day.incidents.length} 次事件</Text>
                      </Group>
                      {day.incidents.map((incident, iIdx) => (
                        <Box key={iIdx} p="md" bg="rgb(15, 18, 26)" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <Group justify="space-between" mb="xs">
                            <Text fw={700} size="15px" c="#ffffff">{incident.latest.monitorName} detection failure</Text>
                            <Badge variant="filled" bg="rgba(239, 68, 68, 0.1)" c="#EF4444" radius="xl" size="sm" fw={700} style={{ textTransform: 'none' }}>停机</Badge>
                          </Group>

                          <Box style={{ position: 'relative', marginTop: '12px' }}>
                            {/* Stacking effect */}
                            {incident.count > 1 && (
                              <>
                                <div style={{ position: 'absolute', bottom: '-4px', left: '4px', right: '4px', height: '10px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 0 8px 8px', zIndex: 0 }} />
                                <div style={{ position: 'absolute', bottom: '-8px', left: '8px', right: '8px', height: '10px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0 0 8px 8px', zIndex: -1 }} />
                              </>
                            )}

                            <Box p="md" bg="rgba(255, 255, 255, 0.03)" style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative', zIndex: 1 }}>
                              <Group gap="sm" align="flex-start">
                                <ThemeIcon size={18} variant="transparent" color={incident.latest.type === 'restored' ? '#10b981' : '#ef4444'} mt={2}>
                                  {incident.latest.type === 'restored' ? <IconCircleCheck size={18} /> : <IconAlertCircle size={18} />}
                                </ThemeIcon>
                                <Stack gap={2}>
                                  <Text size="13px" fw={600}>{incident.latest.type === 'restored' ? '已解决' : '检测到故障'} {new Date(incident.latest.time * 1000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} UTC+8</Text>
                                  <Text size="13px" c="rgb(138, 145, 165)">{incident.latest.message}</Text>
                                </Stack>
                              </Group>
                            </Box>

                            {incident.count > 1 && (
                              <Group gap="sm" mt={16} ml={2}>
                                <Box style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px dotted rgb(138, 145, 165)' }} />
                                <Text size="13px" fw={500} c="rgb(138, 145, 165)">多于之前的 {incident.count - 1} 次更新</Text>
                                <div style={{ position: 'absolute', top: '100%', left: '8px', width: '2px', height: '12px', background: 'rgba(255, 255, 255, 0.05)' }} />
                              </Group>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Container>
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
