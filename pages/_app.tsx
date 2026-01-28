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
              '#10b981', '#10b981', '#047857', '#065f46', '#064e3b'
            ],
            dark: [
              '#d5d7e0', '#acaebf', '#8c8fa3', '#666980', '#4d4f66',
              '#34354a', '#21242d', '#12141a', '#0f121a', '#08090a'
            ]
          },
          primaryShade: 5,
          defaultRadius: 'md',
          components: {
            Container: {
              defaultProps: {
                size: 820 // vps.2x.nz uses a tighter 820px container
              }
            },
            Card: {
              defaultProps: {
                bg: 'rgb(18, 20, 26)',
                withBorder: true,
              },
              styles: {
                root: {
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px'
                }
              }
            },
            Title: {
              styles: {
                root: {
                  letterSpacing: '-0.4px',
                  fontWeight: 700
                }
              }
            }
          }
        }}
      >
        <style jsx global>{`
          body {
            background-color: rgb(15, 18, 26) !important;
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          * {
            transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}</style>
        <TimeAutoSwitch />
        <Component {...pageProps} />
      </MantineProvider>
    </NoSsr>
  )
}
