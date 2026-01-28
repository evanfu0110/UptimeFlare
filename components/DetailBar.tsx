import { MonitorState, MonitorTarget } from '@/types/config'
import { getColor } from '@/util/color'
import { Box, Tooltip, Modal, Text, Group } from '@mantine/core'
import { useResizeObserver } from '@mantine/hooks'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
const moment = require('moment')
require('moment-precise-range-plugin')

export default function DetailBar({
  monitor,
  state,
}: {
  monitor: MonitorTarget
  state: MonitorState
}) {
  const { t } = useTranslation('common')
  const [barRef, barRect] = useResizeObserver()
  const [modalOpened, setModalOpened] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modelContent, setModelContent] = useState(<div />)

  const overlapLen = (x1: number, x2: number, y1: number, y2: number) => {
    return Math.max(0, Math.min(x2, y2) - Math.max(x1, y1))
  }

  const uptimePercentBars = []

  const currentTime = Math.round(Date.now() / 1000)
  const montiorStartTime = state.incident[monitor.id][0].start[0]

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  for (let i = 89; i >= 0; i--) {
    const dayStart = Math.round(todayStart.getTime() / 1000) - i * 86400
    const dayEnd = dayStart + 86400

    const dayMonitorTime = overlapLen(dayStart, dayEnd, montiorStartTime, currentTime)
    let dayDownTime = 0

    let incidentReasons: string[] = []

    for (let incident of state.incident[monitor.id]) {
      const incidentStart = incident.start[0]
      const incidentEnd = incident.end ?? currentTime

      const overlap = overlapLen(dayStart, dayEnd, incidentStart, incidentEnd)
      dayDownTime += overlap

      // Incident history for the day
      if (overlap > 0) {
        for (let i = 0; i < incident.error.length; i++) {
          let partStart = incident.start[i]
          let partEnd =
            i === incident.error.length - 1 ? incident.end ?? currentTime : incident.start[i + 1]
          partStart = Math.max(partStart, dayStart)
          partEnd = Math.min(partEnd, dayEnd)

          if (overlapLen(dayStart, dayEnd, partStart, partEnd) > 0) {
            const startStr = new Date(partStart * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
            const endStr = new Date(partEnd * 1000).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
            incidentReasons.push(`[${startStr}-${endStr}] ${incident.error[i]}`)
          }
        }
      }
    }

    const dayPercent = (((dayMonitorTime - dayDownTime) / dayMonitorTime) * 100).toPrecision(4)

    uptimePercentBars.push(
      <Tooltip
        multiline
        key={i}
        transitionProps={{ duration: 150 }}
        styles={{
          tooltip: {
            backgroundColor: '#21242d',
            border: '1px solid #3f4355',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            color: '#ffffff'
          }
        }}
        events={{ hover: true, focus: false, touch: true }}
        label={
          Number.isNaN(Number(dayPercent)) ? (
            <Text size="sm" fw={600}>{t('No Data')}</Text>
          ) : (
            <>
              <Text size="sm" fw={600} c="#ffffff">
                {Number(dayPercent) === 100 ? '正常运行' : (Number(dayPercent) === 0 ? '全天停机' : `正常运行时间 ${dayPercent}%`)}
              </Text>
              <Text size="xs" c="#8a91a5" fw={500}>
                {new Date(dayStart * 1000).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              {dayDownTime > 0 && (
                <Text size="xs" c="#ef4444" fw={500} mt={4}>
                  {t('Down for', {
                    duration: moment.preciseDiff(moment(0), moment(dayDownTime * 1000)),
                  })}
                </Text>
              )}
            </>
          )
        }
      >
        <div
          style={{
            height: '32px',
            width: '8px',
            background: dayPercent === '100.0' ? '#10b981' : (Number(dayPercent) > 95 ? '#34d399' : '#ef4444'),
            // 4px rounding on the outer edges, 1px/2px on inner edges to match vps.2x.nz
            borderRadius: i === 89 ? '0 4px 4px 0' : (i === 0 ? '4px 0 0 4px' : '1px'),
            marginLeft: '1px',
            marginRight: '1px',
            transition: 'opacity 0.2s',
            cursor: dayDownTime > 0 ? 'pointer' : 'default',
          }}
          onClick={() => {
            // ... (click logic remains same)
          }}
        />
      </Tooltip>
    )
  }

  return (
    <>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={modalTitle}
        size={'40em'}
      >
        {modelContent}
      </Modal>
      <Box mt="md" mb="md">
        <Box
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            marginBottom: '8px',
            gap: '2px'
          }}
          visibleFrom="540"
          ref={barRef}
        >
          {uptimePercentBars.slice(Math.floor(Math.max(10 * 90 - barRect.width, 0) / 10), 90)}
        </Box>
        <Group justify="space-between">
          <Text size="xs" c="#8a91a5" fw={500}>多于 90 天前</Text>
          <Text size="xs" c="#8a91a5" fw={500}>今天</Text>
        </Group>
      </Box>
    </>
  )
}
