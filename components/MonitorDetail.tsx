import { Box, Group, Text, Badge, ThemeIcon, Tooltip } from '@mantine/core'
import { MonitorState, MonitorTarget } from '@/types/config'
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck, IconChevronRight } from '@tabler/icons-react'
import DetailChart from './DetailChart'
import DetailBar from './DetailBar'
import { getColor } from '@/util/color'
import { maintenances } from '@/uptime.config'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'

export default function MonitorDetail({
  monitor,
  state,
}: {
  monitor: MonitorTarget
  state: MonitorState
}) {
  const { t } = useTranslation('common')

  const isUrlIcon = monitor.icon?.startsWith('http') || monitor.icon?.startsWith('/')
  const renderIcon = (marginRight = '4px') => {
    if (!monitor.icon) return null
    if (isUrlIcon) {
      return (
        <img
          src={monitor.icon}
          style={{
            width: '1.2em',
            height: '1.2em',
            marginRight: marginRight,
            flexShrink: 0,
            objectFit: 'contain',
            verticalAlign: 'middle',
            borderRadius: '4px',
          }}
          alt=""
        />
      )
    }
    return (
      <Icon
        icon={monitor.icon}
        style={{
          marginRight: marginRight,
          fontSize: '1.2em',
          flexShrink: 0,
          verticalAlign: 'middle',
        }}
      />
    )
  }

  if (!state.latency[monitor.id])
    return (
      <Box py="sm">
        <Group gap="xs" align="center">
          {renderIcon()}
          <Text size="15px" fw={500} c="#ffffff" style={{ lineHeight: '22.5px' }}>
            {monitor.name}
          </Text>
        </Group>
        <Text mt="xs" fw={500} size="sm" c="rgb(138, 145, 165)">
          {t('No data available')}
        </Text>
      </Box>
    )

  const latestIncident = state.incident[monitor.id].slice(-1)[0]
  const isDown = latestIncident.end === undefined

  // Hide real status icon if monitor is in maintenance
  const now = new Date()
  const hasMaintenance = maintenances
    .filter((m) => now >= new Date(m.start) && (!m.end || now <= new Date(m.end)))
    .find((maintenance) => maintenance.monitors?.includes(monitor.id))

  let totalTime = Date.now() / 1000 - state.incident[monitor.id][0].start[0]
  let downTime = 0
  for (let incident of state.incident[monitor.id]) {
    downTime += (incident.end ?? Date.now() / 1000) - incident.start[0]
  }

  const uptimePercent = (((totalTime - downTime) / totalTime) * 100).toPrecision(4)

  const statusText = hasMaintenance ? '维护中' : (isDown ? '已宕机' : '正常运行')

  return (
    <Box py="sm">
      <Group justify="space-between" mb={12} align="flex-end">
        <Group gap="xs" align="center">
          <ThemeIcon variant="transparent" size={18} color={isDown ? '#ef4444' : '#10b981'}>
            {isDown ? <IconAlertCircle size={18} /> : <IconCircleCheck size={18} />}
          </ThemeIcon>
          <Text size="15px" fw={500} c="#ffffff" style={{ lineHeight: '22.5px' }}>
            {monitor.name}
          </Text>
        </Group>
        <Group gap="sm" align="center">
          <Text size="13px" fw={500} c="rgb(138, 145, 165)" style={{ lineHeight: '19.5px' }}>
            {state.latency[monitor.id].length > 0 ? (
              `${state.latency[monitor.id].slice(-1)[0].ping}ms`
            ) : (
              <></>
            )}
            {' '}{uptimePercent}% 的正常运行时间
          </Text>
          <Badge
            variant="filled"
            bg={isDown ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)'}
            style={{
              color: isDown ? '#EF4444' : '#34D399',
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              height: 'auto'
            }}
          >
            {statusText}
          </Badge>
        </Group>
      </Group>

      <DetailBar monitor={monitor} state={state} />

      {!monitor.hideLatencyChart && (
        <Box mt="xs">
          <DetailChart monitor={monitor} state={state} />
        </Box>
      )}
    </Box>
  )
}
