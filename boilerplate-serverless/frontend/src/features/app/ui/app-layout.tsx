import { ReactNode } from 'react';
import { BreadcrumbGroup, Badge } from '@cloudscape-design/components';
import { BaseLayout } from '@/shared/ui/base-layout';

interface AppLayoutProps {
  children: ReactNode;
  activePage?: 'dashboard';
}

export function AppLayout({ children, activePage }: AppLayoutProps) {
  
  const navigation = {
    header: { text: 'Serverless Boilerplate', href: '/' },
    items: [
      { 
        type: "link", 
        text: "Dashboard", 
        href: "/", 
        active: activePage === 'dashboard' 
      },
      { type: "link", text: "Page 1", href: "#/page1" },
      { type: "link", text: "Page 2", href: "#/page2" },
      { type: "link", text: "Page 3", href: "#/page3" },
      { type: "link", text: "Page 4", href: "#/page4" },
      { type: "divider" },
      {
        type: "link",
        text: "Notifications",
        href: "#/notifications",
        info: <Badge color="red">23</Badge>
      },
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
    { text: "Serverless Boilerplate", href: "/" }
  ];
  
  if (activePage === 'dashboard') {
    breadcrumbItems.push({ text: "Dashboard", href: "/" });
  }

  return (
    <BaseLayout
      navigation={navigation}
      breadcrumbs={
        <BreadcrumbGroup
          items={breadcrumbItems}
          ariaLabel="Breadcrumbs"
        />
      }
    >
      {children}
    </BaseLayout>
  );
}