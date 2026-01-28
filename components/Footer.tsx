import { Container, Divider, Text, Group, Anchor, Center, Box } from '@mantine/core'
import { pageConfig } from '@/uptime.config'

export default function Footer() {
  const defaultFooter =
    '<p style="text-align: center; font-size: 13px; margin-top: 20px; color: #888;"> Open-source monitoring and status page powered by Uptimeflare, made with ❤ by lyc8503. </p>'

  return (
    <footer style={{ marginTop: '80px', paddingBottom: '64px' }}>
      <Container size="md">
        <Divider mb="xl" color="rgba(255, 255, 255, 0.05)" />
        <Stack align="center" gap="xs">
          <Text size="13px" fw={500} c="rgb(138, 145, 165)">
            © {new Date().getFullYear()} Cola. 版权所有。
          </Text>
          <div
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: 'rgba(138, 145, 165, 0.6)'
            }}
            dangerouslySetInnerHTML={{ __html: pageConfig.customFooter ?? defaultFooter }}
          />
        </Stack>
      </Container>
    </footer>
  )
}

import { Stack } from '@mantine/core'

