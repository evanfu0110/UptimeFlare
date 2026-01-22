import '@mantine/core/styles.css'
import type { AppProps } from 'next/app'
import { MantineProvider } from '@mantine/core'
import NoSsr from '@/components/NoSsr'
import { TimeAutoSwitch } from '@/components/TimeAutoSwitch'
import '@/util/i18n'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NoSsr>
      <MantineProvider defaultColorScheme="auto">
        <TimeAutoSwitch />
        <Component {...pageProps} />
      </MantineProvider>
    </NoSsr>
  )
}
