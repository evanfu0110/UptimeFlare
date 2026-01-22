import { Container, Group, Image } from '@mantine/core'
import classes from '@/styles/Header.module.css'
import { pageConfig } from '@/uptime.config'
import { PageConfigLink } from '@/types/config'
import { useTranslation } from 'react-i18next'
import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export default function Header({ style }: { style?: React.CSSProperties }) {
  const { t } = useTranslation('common')
  const linkToElement = (link: PageConfigLink, i: number) => {
    if (link.link.startsWith('/')) {
      return (
        <Link
          key={i}
          href={link.link}
          className={classes.link}
          data-active={link.highlight}
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
        data-active={link.highlight}
      >
        {link.label}
      </a>
    )
  }

  const links = [{ label: t('Incidents'), link: '/incidents' }, ...(pageConfig.links || [])]

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
              <span style={{ fontSize: '20px', fontWeight: 600 }}>Cola Monitor</span>
            </Group>
          </Link>
        </div>

        <Group gap={5} visibleFrom="sm">
          {links?.map(linkToElement)}
        </Group>

        <Group gap={5} hiddenFrom="sm">
          {links?.filter((link) => link.highlight || link.link.startsWith('/')).map(linkToElement)}
        </Group>

        <ThemeToggle />
      </Container>
    </header>
  )
}
