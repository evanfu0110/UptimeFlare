import Head from 'next/head'
import { useRouter } from 'next/router'
import { pageConfig, workerConfig } from '@/uptime.config'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Container, Box, Text, Group, Badge, Stack, ThemeIcon, Title, Center } from '@mantine/core'
import { IconArrowLeft, IconAlertCircle, IconCircleCheck, IconInfoCircle } from '@tabler/icons-react'
import { CompactedMonitorStateWrapper, getFromStore } from '@/worker/src/store'
import { MonitorTarget } from '@/types/config'
import Link from 'next/link'

export const runtime = 'experimental-edge'

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

export default function IncidentDetailPage({ compactedStateStr, monitors }: { compactedStateStr: string; monitors: MonitorTarget[] }) {
    const router = useRouter()
    const { id } = router.query
    const state = new CompactedMonitorStateWrapper(compactedStateStr).uncompact()

    let activeIncident: any = null
    let activeMonitor: any = null

    if (id && typeof id === 'string') {
        const [monId, startTs] = id.split('-')
        activeMonitor = monitors.find(m => m.id === monId)
        if (state.incident[monId]) {
            activeIncident = state.incident[monId].find(inc => String(inc.start[0]) === startTs)
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
                <title>{activeMonitor.name} - 事件详情 | Cola Monitor</title>
            </Head>

            <main style={{ backgroundColor: '#0d0f12', minHeight: '100vh', paddingBottom: '20px' }}>
                <Header />

                <Container size="md" mt={40} mb={64}>
                    {/* Back Button */}
                    <Link href="/incidents" style={{ textDecoration: 'none' }}>
                        <Group gap={4} mb={32} style={{ cursor: 'pointer', color: 'rgb(138, 145, 165)' }}>
                            <IconArrowLeft size={16} />
                            <Text size="13px" fw={500}>返回事件列表</Text>
                        </Group>
                    </Link>

                    {/* Incident Header */}
                    <Box mb={32}>
                        <Title order={1} size="32px" c="#ffffff" fw={700} mb={16} style={{ letterSpacing: '-0.4px' }}>
                            {activeMonitor.name} detection failure
                        </Title>
                        <Group gap="sm" mb={24}>
                            <Badge
                                variant="filled"
                                bg={isResolved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
                                style={{
                                    color: statusColor,
                                    borderRadius: '9999px',
                                    textTransform: 'none',
                                    padding: '4px 12px',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    height: 'auto'
                                }}
                            >
                                {statusLabel}
                            </Badge>
                        </Group>

                        {/* Affected Services Bar */}
                        <Box bg="rgb(18, 20, 26)" p="sm" style={{ borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Group gap="xs">
                                <Text size="13px" fw={500} c="rgb(138, 145, 165)">受影响的服务:</Text>
                                <Badge variant="filled" bg="rgba(255, 255, 255, 0.05)" c="#ffffff" radius="md" size="sm" style={{ textTransform: 'none' }}>{activeMonitor.name}</Badge>
                            </Group>
                        </Box>
                    </Box>

                    {/* Timeline Section */}
                    <Box style={{ position: 'relative' }}>
                        {/* Vertical Line */}
                        <Box
                            style={{
                                position: 'absolute',
                                left: '16.5px',
                                top: '24px',
                                bottom: '24px',
                                width: '1px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                zIndex: 0
                            }}
                        />

                        <Stack gap={40}>
                            {isResolved && (
                                <TimelineItem
                                    status="已解决"
                                    time={activeIncident.end}
                                    message="服务已恢复正常运行。"
                                    color="#10b981"
                                    icon={<IconCircleCheck size={18} />}
                                />
                            )}

                            {activeIncident.error.map((err: string, idx: number) => (
                                <TimelineItem
                                    key={idx}
                                    status={idx === 0 ? "检测到故障" : "故障状态更新"}
                                    time={activeIncident.start[idx]}
                                    message={translateError(err)}
                                    color="#ef4444"
                                    icon={<IconAlertCircle size={18} />}
                                />
                            ))}

                            <TimelineItem
                                status="事件已开始"
                                time={activeIncident.start[0]}
                                message="系统监测到服务连接异常，故障事件已自动建立。"
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

function TimelineItem({ status, time, message, color, icon }: any) {
    return (
        <Group align="flex-start" gap="xl" wrap="nowrap" style={{ position: 'relative', zIndex: 1 }}>
            <Box style={{ position: 'relative', width: '34px', height: '34px' }}>
                <ThemeIcon
                    size={34}
                    radius="xl"
                    variant="filled"
                    bg="rgb(13, 15, 18)"
                    style={{ border: `1px solid rgba(255, 255, 255, 0.1)`, color: color }}
                >
                    {icon}
                </ThemeIcon>
            </Box>

            <Box style={{ flex: 1 }}>
                <Group justify="space-between" mb={8} align="center">
                    <Text fw={700} size="15px" c="#ffffff">{status}</Text>
                    <Text size="13px" c="rgb(138, 145, 165)" fw={500}>
                        {new Date(time * 1000).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} UTC+8
                    </Text>
                </Group>
                <Box
                    p="md"
                    bg="rgba(255, 255, 255, 0.03)"
                    style={{
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        color: 'rgb(180, 184, 195)'
                    }}
                >
                    <Text size="13px" style={{ lineHeight: 1.6 }}>{message}</Text>
                </Box>
            </Box>
        </Group>
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
