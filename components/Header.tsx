import { Container, Group, Image } from '@mantine/core'
import classes from '@/styles/Header.module.css'
import { pageConfig } from '@/uptime.config'
import { PageConfigLink } from '@/types/config'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CSSProperties } from 'react'
import { ThemeToggle } from './ThemeToggle'

export default function Header({ style }: { style?: CSSProperties }) {
  const { t } = useTranslation('common')
  const { pathname } = useRouter()

  const linkToElement = (link: PageConfigLink, i: number) => {
    const isActive = pathname === link.link || (link.link !== '/' && pathname.startsWith(link.link))

    if (link.link.startsWith('/')) {
      return (
        <Link
          key={i}
          href={link.link}
          className={classes.link}
          data-active={isActive}
        >
          {link.label}
        </Link>
      )
    }
    return (
      <a
        key={i}
        href={link.link}
        target="_blank"
        className={classes.link}
      >
        {link.label}
      </a>
    )
  }

  const links = [
    { label: '状态', link: '/' },
    { label: '事件', link: '/incidents' },
  ]

  return (
    <header className={classes.header} style={style}>
      <Container size="md" className={classes.inner}>
        <div>
          <Link
            href="/"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Group gap="xs">
              <Image
                src={pageConfig.logo ?? '/logo.svg'}
                h={32}
                w={32}
                fit="contain"
                alt="logo"
              />
              <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.4px', color: '#EEF1F2' }}>
                Cola Monitor
              </span>
            </Group>
          </Link>
        </div>

        <Group>
          <Group gap={5} visibleFrom="sm">
            {links.map(linkToElement)}
          </Group>

          <Group gap={5} hiddenFrom="sm">
            {links.map(linkToElement)}
          </Group>
        </Group>
      </Container>
    </header>
  )
}
