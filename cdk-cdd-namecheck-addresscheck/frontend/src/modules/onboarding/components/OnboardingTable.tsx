import React from 'react';
import {
  Table,
  Button,
  SpaceBetween,
  Box,
  Header,
  StatusIndicator,
  Link,
} from "@cloudscape-design/components";
import { TableProps } from '@cloudscape-design/components/table';
import { OnboardingSummary } from '../types';
import { useOnboardingList } from '../hooks/useOnboardingList';
import { useNavigate } from 'react-router-dom';

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<OnboardingSummary>[] = [
  {
    id: 'requestId',
    header: 'ID',
    cell: item => (
      <Link href={`/onboarding/${item.requestId}`}>
        {item.requestId}
      </Link>
    ),
    sortingField: 'requestId',
  },
  {
    id: 'email',
    header: 'Email',
    cell: item => item.email,
    sortingField: 'email',
  },
  {
    id: 'firstName',
    header: 'Name',
    cell: item => item.firstName,
    sortingField: 'firstName',
  },
  {
    id: 'status',
    header: 'Status',
    cell: item => (
      <StatusIndicator type={getStatusType(item.status)}>
        {item.status}
      </StatusIndicator>
    ),
    sortingField: 'status',
  },
  {
    id: 'createdAt',
    header: 'Created At',
    cell: item => new Date(item.createdAt).toLocaleString(),
    sortingField: 'createdAt',
  },
];

// Helper function to determine status indicator type
function getStatusType(status: string): "success" | "error" | "warning" | "info" | "pending" | "in-progress" {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    case "CHECKING":
      return "in-progress";
    case "READY_TO_CHECK":
      return "info";
    case "CLARIFICATION":
      return "warning";
    case "NEW":
    default:
      return "pending";
  }
}

function OnboardingTable() {
  const navigate = useNavigate();
  const { onboardings, loading, error } = useOnboardingList();
  const [selectedItems, setSelectedItems] = React.useState<OnboardingSummary[]>([]);

  const handleSelectionChange = ({ detail }: { detail: { selectedItems: OnboardingSummary[] }}) => {
    setSelectedItems(detail.selectedItems);
  };

  if (error) {
    return (
      <Box margin={{ bottom: 'l' }}>
        <StatusIndicator type="error">
          Error loading onboardings: {error.message}
        </StatusIndicator>
      </Box>
    );
  }

  return (
    <Table
      columnDefinitions={COLUMN_DEFINITIONS}
      items={onboardings}
      loading={loading}
      loadingText="Loading onboardings"
      selectionType="multi"
      selectedItems={selectedItems}
      onSelectionChange={handleSelectionChange}
      variant="full-page"
      stickyHeader
      header={
        <Header
          variant="h1"
          counter={onboardings.length > 0 ? `(${onboardings.length})` : undefined}
        >
          Onboarding List
        </Header>
      }
      empty={
        <Box textAlign="center" color="inherit">
          <b>No onboardings</b>
          <Box padding={{ bottom: 's' }} variant="p" color="inherit">
            No onboardings to display.
          </Box>
        </Box>
      }
    />
  );
}

export default OnboardingTable; 