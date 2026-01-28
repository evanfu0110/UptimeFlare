import { Text, Tooltip } from '@mantine/core'
import { MonitorState, MonitorTarget } from '@/types/config'
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'
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
      <>
        <Text mt="sm" fw={700} style={{ display: 'flex', alignItems: 'center' }}>
          {renderIcon('8px')}
          {monitor.name}
        </Text>
        <Text mt="sm" fw={700}>
          {t('No data available')}
        </Text>
      </>
    )

  let statusIcon =
    state.incident[monitor.id].slice(-1)[0].end === undefined ? (
      <IconAlertCircle
        style={{ width: '1.25em', height: '1.25em', color: '#b91c1c', marginRight: '4px' }}
      />
    ) : (
      <IconCircleCheck
        style={{ width: '1.25em', height: '1.25em', color: '#059669', marginRight: '4px' }}
      />
    )

  // Hide real status icon if monitor is in maintenance
  const now = new Date()
  const hasMaintenance = maintenances
    .filter((m) => now >= new Date(m.start) && (!m.end || now <= new Date(m.end)))
    .find((maintenance) => maintenance.monitors?.includes(monitor.id))
  if (hasMaintenance)
    statusIcon = (
      <IconAlertTriangle
        style={{
          width: '1.25em',
          height: '1.25em',
          color: '#fab005',
          marginRight: '4px',
        }}
      />
    )

  let totalTime = Date.now() / 1000 - state.incident[monitor.id][0].start[0]
  let downTime = 0
  for (let incident of state.incident[monitor.id]) {
    downTime += (incident.end ?? Date.now() / 1000) - incident.start[0]
  }

  const uptimePercent = (((totalTime - downTime) / totalTime) * 100).toPrecision(4)

  const statusText = hasMaintenance ? '维护中' : (state.incident[monitor.id].slice(-1)[0].end === undefined ? '已宕机' : '正常运行')
  const statusColorHex = hasMaintenance ? '#f59e0b' : (state.incident[monitor.id].slice(-1)[0].end === undefined ? '#ef4444' : '#10b981')

  const monitorNameElement = (
    <Group gap="xs" style={{ display: 'inline-flex', alignItems: 'center' }}>
      {monitor.statusPageLink ? (
        <a
          href={monitor.statusPageLink}
          target="_blank"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 600,
            fontSize: '15px'
          }}
        >
          {renderIcon()}
          <span style={{ marginLeft: '4px' }}>{monitor.name}</span>
        </a>
      ) : (
        <Group gap={4}>
          {renderIcon()}
          <Text fw={600} size="sm" c="#ffffff">
            {monitor.name}
          </Text>
        </Group>
      )}
    </Group>
  )

  return (
    <Box py="sm">
      <Group justify="space-between" mb="xs">
        {monitor.tooltip ? (
          <Tooltip label={monitor.tooltip}>{monitorNameElement}</Tooltip>
        ) : (
          monitorNameElement
        )}

        <Group gap="md">
          <Text size="xs" c="#8a91a5" fw={600}>
            {uptimePercent}%
          </Text>
          <Badge
            variant="filled"
            bg="#2d313c"
            style={{
              color: '#ffffff',
              textTransform: 'none',
              fontSize: '13px',
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: '4px',
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

import { Badge, Group, Box } from '@mantine/core'

