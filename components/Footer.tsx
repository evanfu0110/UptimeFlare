import { Container, Divider, Text, Group, Anchor, Center, Box } from '@mantine/core'
import { pageConfig } from '@/uptime.config'

export default function Footer() {
  const defaultFooter =
    '<p style="text-align: center; font-size: 13px; margin-top: 20px; color: #888;"> Open-source monitoring and status page powered by Uptimeflare, made with ❤ by lyc8503. </p>'

  return (
    <footer style={{ marginTop: '80px', paddingBottom: '40px' }}>
      <Container size="md">
        <Divider mb="xl" color="rgba(0,0,0,0.05)" />
        <Stack align="center" gap="xs">
          <div
            style={{
              textAlign: 'center',
              fontSize: '13px',
              color: 'var(--mantine-color-dimmed)'
            }}
            dangerouslySetInnerHTML={{ __html: pageConfig.customFooter ?? defaultFooter }}
          />
          <Text size="xs" c="dimmed">
            © {new Date().getFullYear()} {pageConfig.title}. All rights reserved.
          </Text>
        </Stack>
      </Container>
    </footer>
  )
}

import { Stack } from '@mantine/core'

