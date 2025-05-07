import React from 'react';
import {
  Table,
  Button,
  SpaceBetween,
  Box,
  Header,
  StatusIndicator,
} from "@cloudscape-design/components";
import { TableProps } from '@cloudscape-design/components/table';
import { Analysis } from '../types/analysis.types';
import { useAnalysisList } from '../hooks/useAnalysisList';
import { useNavigate } from 'react-router-dom';

// Move column definitions outside component to avoid recreation on each render
const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Analysis>[] = [
  {
    id: 'analysisId',
    header: 'Identifier',
    cell: item => item.analysisId,
    sortingField: 'analysisId',
  },
  {
    id: 'description', 
    header: 'Description',
    cell: item => item.description,
    sortingField: 'description',
  },
  {
    id: 'documentType',
    header: 'Document Type', 
    cell: item => item.documentType,
    sortingField: 'documentType',
  },
  {
    id: 'status',
    header: 'Status',
    cell: item => item.status,
    sortingField: 'status',
  },
  {
    id: 'createdAt',
    header: 'Created At',
    // Format date consistently using UTC
    cell: item => new Date(item.createdAt).toISOString(),
    sortingField: 'createdAt',
  },
];

// Rename to be more descriptive of what it renders
function AnalysisTable() {
  const navigate = useNavigate();
  const { analyses, loading, error } = useAnalysisList();
  const [selectedItems, setSelectedItems] = React.useState<Analysis[]>([]);

  // Extract handlers to improve readability
  const handleSelectionChange = ({ detail }: { detail: { selectedItems: Analysis[] }}) => {
    setSelectedItems(detail.selectedItems);
  };

  if (error) {
    return (
      <Box margin={{ bottom: 'l' }}>
        <StatusIndicator type="error">
          Error loading analyses: {error.message}
        </StatusIndicator>
      </Box>
    );
  }

  const isEmpty = analyses.length === 0;
  const analysisCount = !isEmpty ? `(${analyses.length})` : undefined;
  const isUpdateDisabled = selectedItems.length !== 1;

  return (
    <Table
      columnDefinitions={COLUMN_DEFINITIONS}
      items={analyses}
      loading={loading}
      loadingText="Loading analyses"
      selectionType="multi"
      selectedItems={selectedItems}
      onSelectionChange={handleSelectionChange}
      variant="full-page"
      stickyHeader
      header={
        <Header
          variant="h1"
          counter={analysisCount}
          actions={
            <SpaceBetween size="xs" direction="horizontal">
              <Button 
                variant="primary" 
                onClick={() => navigate('/analysis/create')}
              >
                Create analysis
              </Button>
            </SpaceBetween>
          }
        >
          Analysis List
        </Header>
      }
      empty={
        <Box textAlign="center" color="inherit">
          <b>No analyses</b>
          <Box
            padding={{ bottom: 's' }}
            variant="p"
            color="inherit"
          >
            No analyses to display.
          </Box>
          <Button onClick={() => navigate('/analysis/create')}>
            Create analysis
          </Button>
        </Box>
      }
    />
  );
}

export default AnalysisTable;
