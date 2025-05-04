import { 
  ContentLayout,
  Grid,
  Header,
  SpaceBetween,
  Container,
  Box
} from '@cloudscape-design/components'
import { AppLayout } from '@/features/app/ui/app-layout'

export default function DashboardPage() {
  return (
    <AppLayout activePage="dashboard">
      <ContentLayout
        header={
          <Header variant="h1">Dashboard</Header>
        }
      >
        <Container>
          <SpaceBetween size="l">
            <Box variant="h3">Welcome to the Serverless Boilerplate</Box>
            <Grid
              gridDefinition={[
                { colspan: { default: 12, xs: 12, s: 12, m: 6, l: 6, xl: 6 } },
                { colspan: { default: 12, xs: 12, s: 12, m: 6, l: 6, xl: 6 } },
              ]}
            >
              <Container header={<Header variant="h2">Overview</Header>}>
                <Box variant="p">Your application content goes here.</Box>
              </Container>
              <Container header={<Header variant="h2">Activity</Header>}>
                <Box variant="p">Recent activity will be shown here.</Box>
              </Container>
            </Grid>
          </SpaceBetween>
        </Container>
      </ContentLayout>
    </AppLayout>
  );
}