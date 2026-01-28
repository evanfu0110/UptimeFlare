import '@mantine/core/styles.css'
import type { AppProps } from 'next/app'
import { MantineProvider } from '@mantine/core'
import NoSsr from '@/components/NoSsr'
import { TimeAutoSwitch } from '@/components/TimeAutoSwitch'
import '@/util/i18n'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NoSsr>
      <MantineProvider
        defaultColorScheme="dark"
        theme={{
          primaryColor: 'emerald',
          colors: {
            emerald: [
              '#ecfdf5', '#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399',
              '#10b981', '#059669', '#047857', '#065f46', '#064e3b'
            ],
            dark: [
              '#d5d7e0', '#acaebf', '#8c8fa3', '#666980', '#4d4f66',
              '#34354a', '#2b2c3d', '#111318', '#0d0f12', '#08090a'
            ]
          },
          primaryShade: 5,
          defaultRadius: 'md',
          components: {
            Container: {
              defaultProps: {
                size: 1000
              }
            },
            Card: {
              defaultProps: {
                bg: 'dark.7',
                withBorder: true,
              },
              styles: {
                root: {
                  borderColor: '#21242d',
                  borderRadius: '12px'
                }
              }
            }
          }
        }}
      >
        <style jsx global>{`
          body {
            background-color: #0d0f12 !important;
            color: #ffffff;
          }
        `}</style>
        <TimeAutoSwitch />
        <Component {...pageProps} />
      </MantineProvider>
    </NoSsr>
  )
}
