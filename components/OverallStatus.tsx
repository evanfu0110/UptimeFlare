import { MaintenanceConfig, MonitorTarget } from '@/types/config'
import { Center, Container, Title, Collapse, Text, Card, ThemeIcon, Stack } from '@mantine/core'
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
    statusString = '所有系统目前都处于停机状态'
    statusColor = 'red'
  } else if (state.overallDown === 0) {
    statusString = '所有系统都在正常运行'
    statusColor = 'teal'
    icon = <IconCircleCheck style={{ width: 48, height: 48 }} />
  } else {
    statusString = '部分系统目前出现故障'
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
    <Container size="md" mt={60} mb={60}>
      <Stack align="center" gap="sm">
        <ThemeIcon
          size={48}
          radius="100%"
          color={statusColor === 'teal' ? '#10b981' : '#ef4444'}
          variant="filled"
        >
          {icon}
        </ThemeIcon>

        <Title
          style={{
            textAlign: 'center',
            fontSize: '36px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em'
          }}
        >
          {statusString}
        </Title>

        <Text c="#8a91a5" size="sm" mt={-5} style={{ textAlign: 'center', fontWeight: 500 }}>
          {t('Last updated on', {
            date: new Date(state.lastUpdate * 1000).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            seconds: currentTime - state.lastUpdate,
          })}
        </Text>
      </Stack>

      {/* Upcoming & Active Maintenance left as is but with slightly better margins */}


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
