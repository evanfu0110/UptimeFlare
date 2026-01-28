import Head from 'next/head'
import { useRouter } from 'next/router'
import { pageConfig, workerConfig } from '@/uptime.config'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Container, Box, Text, Group, Badge, Stack, ThemeIcon, ActionIcon, Title, Center } from '@mantine/core'
import { IconArrowLeft, IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'
import { CompactedMonitorStateWrapper, getFromStore } from '@/worker/src/store'
import { MonitorState, MonitorTarget } from '@/types/config'
import Link from 'next/link'

export const runtime = 'experimental-edge'

interface IncidentPageProps {
    compactedStateStr: string
    monitors: MonitorTarget[]
}

export default function IncidentDetailPage({ compactedStateStr, monitors }: IncidentPageProps) {
    const router = useRouter()
    const { id } = router.query
    const state = new CompactedMonitorStateWrapper(compactedStateStr).uncompact()

    // Find the incident and monitor
    let activeIncident: any = null
    let activeMonitor: any = null

    if (id && typeof id === 'string') {
        for (const monitorId in state.incident) {
            const incident = state.incident[monitorId].find(inc => `${monitorId}-${inc.start[0]}` === id)
            if (incident) {
                activeIncident = incident
                activeMonitor = monitors.find(m => m.id === monitorId)
                break
            }
        }
    }

    if (!activeIncident || !activeMonitor) {
        return (
            <>
                <Header />
                <Container size="md" mt={100} mb={100}>
                    <Center><Text fw={700}>未找到该事件详情</Text></Center>
                </Container>
                <Footer />
            </>
        )
    }

    const isResolved = activeIncident.end !== undefined
    const statusColor = isResolved ? '#10b981' : '#ef4444'
    const statusLabel = isResolved ? '已解决' : '停机'

    return (
        <>
            <Head>
                <title>{activeMonitor.name} - 事件详情 | {pageConfig.title}</title>
            </Head>

            <main style={{ backgroundColor: '#0d0f12', minHeight: '100vh' }}>
                <Header />

                <Container size="md" mt={40} mb={100}>
                    {/* Back Button */}
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <Group gap={4} mb="xl" style={{ cursor: 'pointer', color: '#8a91a5' }}>
                            <IconArrowLeft size={16} />
                            <Text size="sm" fw={500}>返回概览</Text>
                        </Group>
                    </Link>

                    {/* Incident Header */}
                    <Box mb={40}>
                        <Title order={1} size="h1" c="#ffffff" fw={800} mb="xs" style={{ letterSpacing: '-0.02em' }}>
                            {activeMonitor.name}
                        </Title>
                        <Group gap="sm">
                            <Badge
                                variant="filled"
                                bg={isResolved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}
                                style={{
                                    color: statusColor,
                                    border: `1px solid ${statusColor}`,
                                    borderRadius: '9999px',
                                    textTransform: 'none',
                                    padding: '4px 12px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    height: 'auto'
                                }}
                            >
                                {statusLabel}
                            </Badge>
                            <Text size="sm" c="#8a91a5" fw={500}>
                                受影响的服务: <Box component="span" px={8} py={2} style={{ backgroundColor: '#1e2128', borderRadius: '4px', color: '#ffffff' }}>{activeMonitor.name}</Box>
                            </Text>
                        </Group>
                    </Box>

                    {/* Timeline Section */}
                    <Box style={{ position: 'relative' }}>
                        {/* Vertical Line */}
                        <Box
                            style={{
                                position: 'absolute',
                                left: '16px',
                                top: '20px',
                                bottom: '20px',
                                width: '2px',
                                backgroundColor: '#21242d',
                                zIndex: 0
                            }}
                        />

                        <Stack gap={40}>
                            {/* Iterating Backwards through updates if they exist. 
                  In UptimeFlare, an incident is usually [Down, ..., Up].
              */}
                            {isResolved && (
                                <TimelineItem
                                    status="已解决"
                                    time={activeIncident.end}
                                    message="服务已恢复正常运行。"
                                    isLast={false}
                                    color="#10b981"
                                    icon={<IconCircleCheck size={18} />}
                                />
                            )}

                            {activeIncident.error.map((err: string, idx: number) => (
                                <TimelineItem
                                    key={idx}
                                    status={idx === 0 ? "已检测到故障" : "故障检查中"}
                                    time={activeIncident.start[idx]}
                                    message={translateError(err)}
                                    isLast={idx === activeIncident.error.length - 1 && !isResolved}
                                    color="#ef4444"
                                    icon={<IconAlertCircle size={18} />}
                                />
                            ))}

                            <TimelineItem
                                status="事件已开始"
                                time={activeIncident.start[0]}
                                message="系统检测到异常行为，正在启动自动调查。"
                                isLast={true}
                                color="#8a91a5"
                                icon={<IconInfoCircle size={18} />}
                            />
                        </Stack>
                    </Box>
                </Container>

                <Footer />
            </main>
        </>
    )
}

function TimelineItem({ status, time, message, isLast, color, icon }: any) {
    return (
        <Group align="flex-start" gap="xl" style={{ position: 'relative', zIndex: 1 }}>
            <ThemeIcon
                size={34}
                radius="xl"
                variant="filled"
                bg="#0d0f12"
                style={{ border: `2px solid ${isLast ? '#21242d' : color}`, color: color }}
            >
                {icon}
            </ThemeIcon>

            <Box style={{ flex: 1 }}>
                <Group justify="space-between" mb={4}>
                    <Text fw={700} size="md" c="#ffffff">{status}</Text>
                    <Text size="xs" c="#8a91a5" fw={500}>
                        {new Date(time * 1000).toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </Group>
                <Box
                    p="md"
                    style={{
                        backgroundColor: '#111318',
                        border: '1px solid #21242d',
                        borderRadius: '12px',
                        color: '#ffffff'
                    }}
                >
                    <Text size="sm" style={{ lineHeight: 1.6 }}>{message}</Text>
                </Box>
            </Box>
        </Group>
    )
}

function translateError(msg: string): string {
    if (!msg) return ''
    if (msg.includes('timed out')) return '系统在尝试连接服务时请求超时。这通常意味着网络路径拥堵或目标服务器响应过慢。'
    if (msg.includes('fetch failed')) return '无法获取目标资源。这可能是由于 DNS 解析失败或网络适配器错误引起的。'
    if (msg.includes('connection reset')) return '连接被对端重置。服务器可能已由于过载或其他故障主动切断了连接。'
    if (msg.includes('ECONNREFUSED')) return '服务器拒绝了连接请求。这通常意味着服务未在目标端口上运行。'
    if (msg.includes('404')) return '页面未找到 (404)。目标路径已不存在或发生了错误的重定向。'
    if (msg.includes('500')) return '服务器内部错误 (500)。目标后端服务发生了崩溃或配置错误。'
    if (msg.includes('502')) return '网关错误 (502)。前端负载均衡器无法连接到后端应用实例。'
    if (msg.includes('503')) return '服务不可用 (503)。服务器当前由于维护或过载无法处理该请求。'
    return msg
}

export async function getServerSideProps() {
    const compactedStateStr = await getFromStore(process.env as any, 'state')
    const monitors = workerConfig.monitors.map((monitor) => ({
        id: monitor.id,
        name: monitor.name,
    }))
    return { props: { compactedStateStr, monitors } }
}
