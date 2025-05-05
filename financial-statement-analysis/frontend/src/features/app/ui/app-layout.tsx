import { ReactNode } from 'react';
import { BreadcrumbGroup } from '@cloudscape-design/components';
import { BaseLayout } from '@/shared/ui/base-layout';

interface AppLayoutProps {
  children: ReactNode;
  activePage?: 'dashboard' | 'extractions';
}

export function AppLayout({ children, activePage }: AppLayoutProps) {
  
  const navigation = {
    header: { text: 'Extractions', href: '/' },
    items: [
      { 
        type: "link", 
        text: "Dashboard", 
        href: "/", 
        active: activePage === 'dashboard' 
      },
      { 
        type: "link", 
        text: "Extractions", 
        href: "/extractions",
        active: activePage === 'extractions'
      },
      { type: "divider" },
      {
        type: "link",
        text: "Documentation",
        href: "https://example.com",
        external: true
      }
    ],
  } as const;

  // Define breadcrumb items based on active page
  const breadcrumbItems = [
    { text: "Extractions", href: "/" }
  ];
  
  if (activePage === 'dashboard') {
    breadcrumbItems.push({ text: "Dashboard", href: "/" });
  } else if (activePage === 'extractions') {
    breadcrumbItems.push({ text: "Extractions", href: "/extractions" });
  }

  // Use table contentType for the extractions page
  const contentType = activePage === 'extractions' ? 'table' : 'default';

  return (
    <BaseLayout
      navigation={navigation}
      breadcrumbs={
        <BreadcrumbGroup
          items={breadcrumbItems}
          ariaLabel="Breadcrumbs"
        />
      }
      contentType={contentType}
    >
      {children}
    </BaseLayout>
  );
}