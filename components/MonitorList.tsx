import { MonitorState, MonitorTarget } from '@/types/config'
import { Accordion, Card, Center, Text, Group, Badge, Stack, Box } from '@mantine/core'
import MonitorDetail from './MonitorDetail'
import { pageConfig } from '@/uptime.config'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import classes from '@/styles/MonitorList.module.css'

function countDownCount(state: MonitorState, ids: string[]) {
  let downCount = 0
  for (let id of ids) {
    if (state.incident[id] === undefined || state.incident[id].length === 0) {
      continue
    }

    if (state.incident[id].slice(-1)[0].end === undefined) {
      downCount++
    }
  }
  return downCount
}

function getStatusTextColor(state: MonitorState, ids: string[]) {
  let downCount = countDownCount(state, ids)
  if (downCount === 0) {
    return '#10b981'
  } else if (downCount === ids.length) {
    return '#ef4444'
  } else {
    return '#f59e0b'
  }
}

export default function MonitorList({
  monitors,
  state,
}: {
  monitors: MonitorTarget[]
  state: MonitorState
}) {
  const { t } = useTranslation('common')
  const group = pageConfig.group
  const groupedMonitor = group && Object.keys(group).length > 0
  let content

  // Load expanded groups from localStorage
  const [expandedGroups, setExpandedGroups] = useState<string[]>(Object.keys(group || {}))

  useEffect(() => {
    const saved = localStorage.getItem('expandedGroups')
    if (saved) {
      try {
        setExpandedGroups(JSON.parse(saved))
      } catch (e) { }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('expandedGroups', JSON.stringify(expandedGroups))
  }, [expandedGroups])

  if (groupedMonitor) {
    // Grouped monitors
    content = (
      <Accordion
        multiple
        defaultValue={Object.keys(group)}
        variant="separated"
        value={expandedGroups}
        onChange={(values) => setExpandedGroups(values)}
        classNames={{
          item: classes.accordionItem,
          control: classes.accordionControl,
          chevron: classes.accordionChevron,
          panel: classes.accordionPanel,
        }}
      >
        {Object.keys(group).map((groupName) => (
          <Accordion.Item key={groupName} value={groupName}>
            <Accordion.Control>
              <Group justify="space-between" style={{ width: '100%' }}>
                <Text fw={700} size="16px" c="#ffffff" style={{ letterSpacing: '-0.2px' }}>{groupName}</Text>
                <Badge
                  variant="filled"
                  bg={`${getStatusTextColor(state, group[groupName])}25`}
                  style={{
                    color: getStatusTextColor(state, group[groupName]),
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: '8px'
                  }}
                  size="sm"
                >
                  {group[groupName].length - countDownCount(state, group[groupName])}/
                  {group[groupName].length} {t('Operational')}
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap={12}>
                {monitors
                  .filter((monitor) => group[groupName].includes(monitor.id))
                  .sort((a, b) => group[groupName].indexOf(a.id) - group[groupName].indexOf(b.id))
                  .map((monitor) => (
                    <Box key={monitor.id} className={classes.childCard}>
                      <MonitorDetail monitor={monitor} state={state} />
                    </Box>
                  ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    )
  } else {
    // Ungrouped monitors
    content = (
      <Stack gap="md">
        {monitors.map((monitor) => (
          <Box key={monitor.id} className={classes.childCard} style={{ backgroundColor: 'rgb(22, 24, 30)', borderRadius: '16px' }}>
            <MonitorDetail monitor={monitor} state={state} />
          </Box>
        ))}
      </Stack>
    )
  }

  return (
    <Center>
      <Box
        ml="md"
        mr="md"
        mt="xl"
        style={{
          width: groupedMonitor ? '897px' : '865px',
        }}
      >
        {content}
      </Box>
    </Center>
  )
}
