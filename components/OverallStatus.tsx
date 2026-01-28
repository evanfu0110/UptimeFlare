import { MaintenanceConfig, MonitorTarget } from '@/types/config'
import { Center, Container, Title, Collapse, Text, Card, ThemeIcon } from '@mantine/core'
import { IconCircleCheck, IconAlertCircle } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import MaintenanceAlert from './MaintenanceAlert'
import { pageConfig } from '@/uptime.config'
import { useTranslation } from 'react-i18next'

function useWindowVisibility() {
  const [isVisible, setIsVisible] = useState(true)
  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])
  return isVisible
}

export default function OverallStatus({
  state,
  maintenances,
  monitors,
}: {
  state: { overallUp: number; overallDown: number; lastUpdate: number }
  maintenances: MaintenanceConfig[]
  monitors: MonitorTarget[]
}) {
  const { t } = useTranslation('common')
  let group = pageConfig.group
  let groupedMonitor = (group && Object.keys(group).length > 0) || false

  let statusString = ''
  let statusColor = 'gray'
  let icon = <IconAlertCircle style={{ width: 48, height: 48 }} />

  if (state.overallUp === 0 && state.overallDown === 0) {
    statusString = t('No data yet')
  } else if (state.overallUp === 0) {
    statusString = t('All systems not operational')
    statusColor = 'red'
  } else if (state.overallDown === 0) {
    statusString = t('All systems operational')
    statusColor = 'teal'
    icon = <IconCircleCheck style={{ width: 48, height: 48 }} />
  } else {
    statusString = t('Some systems not operational', {
      down: state.overallDown,
      total: state.overallUp + state.overallDown,
    })
    statusColor = 'orange'
  }

  const [openTime] = useState(Math.round(Date.now() / 1000))
  const [currentTime, setCurrentTime] = useState(Math.round(Date.now() / 1000))
  const isWindowVisible = useWindowVisibility()
  const [expandUpcoming, setExpandUpcoming] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isWindowVisible) return
      if (currentTime - state.lastUpdate > 300 && currentTime - openTime > 30) {
        window.location.reload()
      }
      setCurrentTime(Math.round(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(interval)
  })

  const now = new Date()

  const activeMaintenances: (Omit<MaintenanceConfig, 'monitors'> & {
    monitors?: MonitorTarget[]
  })[] = maintenances
    .filter((m) => now >= new Date(m.start) && (!m.end || now <= new Date(m.end)))
    .map((maintenance) => ({
      ...maintenance,
      monitors: maintenance.monitors?.map(
        (monitorId) => monitors.find((mon) => monitorId === mon.id)!
      ),
    }))

  const upcomingMaintenances: (Omit<MaintenanceConfig, 'monitors'> & {
    monitors?: (MonitorTarget | undefined)[]
  })[] = maintenances
    .filter((m) => now < new Date(m.start))
    .map((maintenance) => ({
      ...maintenance,
      monitors: maintenance.monitors?.map(
        (monitorId) => monitors.find((mon) => monitorId === mon.id)!
      ),
    }))

  return (
    <Container size="md" mt="xl" mb="xl">
      <Card
        padding="xl"
        radius="lg"
        shadow="sm"
        withBorder
        bg={statusColor === 'teal' ? 'rgba(5, 150, 105, 0.05)' : undefined}
        style={{ maxWidth: groupedMonitor ? '897px' : '865px', margin: '0 auto' }}
      >
        <Center>
          <ThemeIcon
            size={80}
            radius="100%"
            color={statusColor}
            variant="light"
          >
            {icon}
          </ThemeIcon>
        </Center>
        <Title mt="md" style={{ textAlign: 'center' }} order={2}>
          {statusString}
        </Title>
        <Text c="dimmed" size="sm" mt="xs" style={{ textAlign: 'center' }}>
          {t('Last updated on', {
            date: new Date(state.lastUpdate * 1000).toLocaleString(),
            seconds: currentTime - state.lastUpdate,
          })}
        </Text>
      </Card>

      {/* Upcoming Maintenance */}
      {upcomingMaintenances.length > 0 && (
        <div style={{ maxWidth: groupedMonitor ? '897px' : '865px', margin: '20px auto 0' }}>
          <Title mt="4px" style={{ textAlign: 'center', color: '#70778c' }} order={5}>
            {t('upcoming maintenance', { count: upcomingMaintenances.length })}{' '}
            <span
              style={{ textDecoration: 'underline', cursor: 'pointer' }}
              onClick={() => setExpandUpcoming(!expandUpcoming)}
            >
              {expandUpcoming ? t('Hide') : t('Show')}
            </span>
          </Title>

          <Collapse in={expandUpcoming}>
            {upcomingMaintenances.map((maintenance, idx) => (
              <MaintenanceAlert
                key={`upcoming-${idx}`}
                maintenance={maintenance}
                upcoming
              />
            ))}
          </Collapse>
        </div>
      )}

      {/* Active Maintenance */}
      {activeMaintenances.length > 0 && (
        <div style={{ maxWidth: groupedMonitor ? '897px' : '865px', margin: '20px auto 0' }}>
          {activeMaintenances.map((maintenance, idx) => (
            <MaintenanceAlert
              key={`active-${idx}`}
              maintenance={maintenance}
            />
          ))}
        </div>
      )}
    </Container>
  )
}
