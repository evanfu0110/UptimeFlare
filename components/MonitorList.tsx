import { MonitorState, MonitorTarget } from '@/types/config'
import { Accordion, Card, Center, Text } from '@mantine/core'
import MonitorDetail from './MonitorDetail'
import { pageConfig } from '@/uptime.config'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

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
    return '#059669'
  } else if (downCount === ids.length) {
    return '#df484a'
  } else {
    return '#f29030'
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
  const savedExpandedGroups = localStorage.getItem('expandedGroups')
  const expandedInitial = savedExpandedGroups
    ? JSON.parse(savedExpandedGroups)
    : Object.keys(group || {})
  const [expandedGroups, setExpandedGroups] = useState<string[]>(expandedInitial)
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
        styles={{
          item: {
            border: '1px solid #21242d',
            backgroundColor: '#111318',
            marginBottom: '16px',
            borderRadius: '12px',
            overflow: 'hidden'
          },
          control: {
            padding: '16px 20px',
          },
          panel: { padding: '0 20px 10px 20px' },
          content: { padding: 0 }
        }}
      >
        {Object.keys(group).map((groupName) => (
          <Accordion.Item key={groupName} value={groupName}>
            <Accordion.Control>
              <Group justify="space-between" style={{ width: '100%' }}>
                <Text fw={700} size="md" c="#ffffff">{groupName}</Text>
                <Badge
                  variant="light"
                  bg={`${getStatusTextColor(state, group[groupName])}15`}
                  style={{ color: getStatusTextColor(state, group[groupName]), textTransform: 'none' }}
                  size="sm"
                >
                  {group[groupName].length - countDownCount(state, group[groupName])}/
                  {group[groupName].length} {t('Operational')}
                </Badge>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap={0}>
                {monitors
                  .filter((monitor) => group[groupName].includes(monitor.id))
                  .sort((a, b) => group[groupName].indexOf(a.id) - group[groupName].indexOf(b.id))
                  .map((monitor, idx, arr) => (
                    <Box
                      key={monitor.id}
                      style={{
                        borderBottom: idx === arr.length - 1 ? 'none' : '1px solid #21242d'
                      }}
                    >
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
          <Card key={monitor.id} withBorder radius="md" padding="0" shadow="none">
            <Box px="md">
              <MonitorDetail monitor={monitor} state={state} />
            </Box>
          </Card>
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

import { Box, Stack, Group, Badge } from '@mantine/core'

