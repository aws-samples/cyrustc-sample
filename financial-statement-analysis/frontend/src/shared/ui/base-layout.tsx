import { AppLayoutToolbar, SideNavigation, Flashbar } from '@cloudscape-design/components'
import type { SideNavigationProps } from '@cloudscape-design/components/side-navigation'
import { type PropsWithChildren, type ReactNode, useState } from 'react'
import { I18nProvider } from '@cloudscape-design/components/i18n'
import messages from '@cloudscape-design/components/i18n/messages/all.en'

const LOCALE = 'en'

interface BaseLayoutProps extends PropsWithChildren {
  navigation: {
    header: SideNavigationProps['header']
    items: SideNavigationProps['items']
  }
  breadcrumbs?: ReactNode
  contentType?: 'default' | 'table' | 'form' | 'cards' | 'wizard' | 'dashboard'
}

export function BaseLayout({ children, navigation, breadcrumbs, contentType = 'default' }: BaseLayoutProps) {
  const [navigationOpen, setNavigationOpen] = useState(true)

  return (
    <I18nProvider locale={LOCALE} messages={[messages]}>
      <AppLayoutToolbar
        navigationOpen={navigationOpen}
        onNavigationChange={({ detail }) => setNavigationOpen(detail.open)}
        navigation={<SideNavigation {...navigation} />}
        content={children}
        breadcrumbs={breadcrumbs}
        notifications={
          <Flashbar items={[]} />
        }
        contentType={contentType}
      />
    </I18nProvider>
  )
}