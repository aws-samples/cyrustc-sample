import { 
  Header,
  Table,
  Box,
  Button,
  Pagination,
  TextFilter,
  CollectionPreferences,
  ProgressBar,
  StatusIndicator,
  SplitPanel,
  SpaceBetween,
  Container,
  ExpandableSection,
  ColumnLayout
} from '@cloudscape-design/components';
import { AppLayout } from '@/features/app/ui/app-layout';
import { useState } from 'react';

// Mock data for development
const mockExtractions = [
  {
    id: 'EXT-001',
    customer: 'Acme Inc.',
    progress: 100,
    status: 'Completed',
    requestedOn: '2023-10-15T14:30:00Z',
    details: {
      source: 'Financial Report 2023',
      fileSize: '2.4 MB',
      pages: 42,
      author: 'John Smith',
      lastModified: '2023-10-14T09:30:00Z',
      extractionConfig: {
        extractTables: true,
        extractText: true,
        extractFigures: false
      }
    }
  },
  {
    id: 'EXT-002',
    customer: 'Globex Corp',
    progress: 45,
    status: 'In Progress',
    requestedOn: '2023-10-16T09:45:00Z',
    details: {
      source: 'Q3 Earnings Report',
      fileSize: '1.8 MB',
      pages: 28,
      author: 'Sarah Johnson',
      lastModified: '2023-10-16T08:15:00Z',
      extractionConfig: {
        extractTables: true,
        extractText: true,
        extractFigures: true
      }
    }
  },
  {
    id: 'EXT-003',
    customer: 'Initech',
    progress: 10,
    status: 'Failed',
    requestedOn: '2023-10-16T11:20:00Z',
    details: {
      source: 'Annual Statement 2022',
      fileSize: '3.1 MB',
      pages: 56,
      author: 'Mike Bolton',
      lastModified: '2023-10-15T17:45:00Z',
      extractionConfig: {
        extractTables: true,
        extractText: false,
        extractFigures: false
      },
      error: 'Document format not supported'
    }
  },
  {
    id: 'EXT-004',
    customer: 'Massive Dynamic',
    progress: 100,
    status: 'Completed',
    requestedOn: '2023-10-17T08:15:00Z',
    details: {
      source: 'Balance Sheet Analysis',
      fileSize: '1.2 MB',
      pages: 18,
      author: 'Walter Bishop',
      lastModified: '2023-10-16T22:10:00Z',
      extractionConfig: {
        extractTables: true,
        extractText: true,
        extractFigures: true
      }
    }
  },
  {
    id: 'EXT-005',
    customer: 'Stark Industries',
    progress: 75,
    status: 'In Progress',
    requestedOn: '2023-10-17T16:30:00Z',
    details: {
      source: 'R&D Financial Report',
      fileSize: '4.7 MB',
      pages: 73,
      author: 'Tony Stark',
      lastModified: '2023-10-17T14:20:00Z',
      extractionConfig: {
        extractTables: true,
        extractText: true,
        extractFigures: true
      }
    }
  },
  {
    id: 'EXT-006',
    customer: 'Wayne Enterprises',
    progress: 0,
    status: 'Pending',
    requestedOn: '2023-10-18T09:00:00Z',
    details: {
      source: 'Wayne Foundation Annual Report',
      fileSize: '2.9 MB',
      pages: 48,
      author: 'Bruce Wayne',
      lastModified: '2023-10-17T23:45:00Z',
      extractionConfig: {
        extractTables: true,
        extractText: true,
        extractFigures: false
      }
    }
  }
];

// Format the date in a user-friendly way
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

// Progress bar component for the table
function ExtractionProgress({ item }: { item: typeof mockExtractions[0] }) {
  // Create appropriate status indicator based on progress and status
  let statusIndicator;
  
  if (item.progress === 0) {
    statusIndicator = <StatusIndicator type="pending">Pending</StatusIndicator>;
  } else if (item.progress === 100) {
    statusIndicator = <StatusIndicator type="success">Success</StatusIndicator>;
  } else if (item.status === 'Failed') {
    statusIndicator = <StatusIndicator type="error">Error</StatusIndicator>;
  } else {
    statusIndicator = <StatusIndicator type="in-progress">{`${item.progress}% complete`}</StatusIndicator>;
  }

  return (
    <ProgressBar 
      value={item.progress}
      additionalInfo={statusIndicator}
    />
  );
}

// Detail panel content component
function DetailPanel({ item }: { item: typeof mockExtractions[0] }) {
  if (!item) return <Box>Select an extraction to view details</Box>;
  
  return (
    <SpaceBetween size="l">
      <Header variant="h2">{`Extraction Details - ${item.id}`}</Header>
      
      <Container header={<Header variant="h3">Document Information</Header>}>
        <ColumnLayout columns={2} variant="text-grid">
          <SpaceBetween size="l">
            <div>
              <Box variant="awsui-key-label">Source</Box>
              <Box>{item.details.source}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">File Size</Box>
              <Box>{item.details.fileSize}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Pages</Box>
              <Box>{item.details.pages}</Box>
            </div>
          </SpaceBetween>
          <SpaceBetween size="l">
            <div>
              <Box variant="awsui-key-label">Author</Box>
              <Box>{item.details.author}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Last Modified</Box>
              <Box>{formatDate(item.details.lastModified)}</Box>
            </div>
            <div>
              <Box variant="awsui-key-label">Extraction Started</Box>
              <Box>{formatDate(item.requestedOn)}</Box>
            </div>
          </SpaceBetween>
        </ColumnLayout>
      </Container>

      <Container header={<Header variant="h3">Extraction Configuration</Header>}>
        <ColumnLayout columns={3} variant="text-grid">
          <div>
            <Box variant="awsui-key-label">Extract Tables</Box>
            <Box>{item.details.extractionConfig.extractTables ? 'Yes' : 'No'}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Extract Text</Box>
            <Box>{item.details.extractionConfig.extractText ? 'Yes' : 'No'}</Box>
          </div>
          <div>
            <Box variant="awsui-key-label">Extract Figures</Box>
            <Box>{item.details.extractionConfig.extractFigures ? 'Yes' : 'No'}</Box>
          </div>
        </ColumnLayout>
      </Container>

      {item.status === 'Failed' && item.details.error && (
        <Container header={<Header variant="h3">Error Information</Header>}>
          <StatusIndicator type="error">{item.details.error}</StatusIndicator>
        </Container>
      )}
    </SpaceBetween>
  );
}

export default function ExtractionsPage() {
  // State for table controls
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [filterText, setFilterText] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [splitPanelOpen, setSplitPanelOpen] = useState(false);
  
  // Get the currently selected item
  const selectedItem = selectedItems.length > 0 ? selectedItems[0] : null;

  // Filter the data based on the filter text
  const filteredExtractions = mockExtractions.filter(
    item => 
      item.id.toLowerCase().includes(filterText.toLowerCase()) ||
      item.customer.toLowerCase().includes(filterText.toLowerCase()) ||
      item.status.toLowerCase().includes(filterText.toLowerCase())
  );

  // Open split panel when item is selected
  const handleSelectionChange = ({ detail }: { detail: { selectedItems: typeof selectedItems } }) => {
    setSelectedItems(detail.selectedItems);
    if (detail.selectedItems.length > 0) {
      setSplitPanelOpen(true);
    }
  };

  return (
    <AppLayout 
      activePage="extractions"
      splitPanel={
        <SplitPanel header="Extraction details" i18nStrings={{ preferencesTitle: 'Preferences' }}>
          {selectedItem ? (
            <DetailPanel item={selectedItem} />
          ) : (
            <Box textAlign="center" color="inherit">
              <b>No extraction selected</b>
              <Box variant="p" color="inherit">
                Select an extraction to view its details.
              </Box>
            </Box>
          )}
        </SplitPanel>
      }
      splitPanelOpen={splitPanelOpen}
      onSplitPanelToggle={(open: boolean) => setSplitPanelOpen(open)}
    >
      <Table
        columnDefinitions={[
          {
            id: 'id',
            header: 'Unique ID',
            cell: item => item.id,
            sortingField: 'id',
            width: '30%'
          },
          {
            id: 'customer',
            header: 'Customer',
            cell: item => item.customer,
            sortingField: 'customer',
            width: '30%'
          },
          {
            id: 'progress',
            header: 'Progress',
            cell: item => <ExtractionProgress item={item} />,
            sortingField: 'progress',
            width: '20%'
          },
          {
            id: 'requestedOn',
            header: 'Requested On',
            cell: item => formatDate(item.requestedOn),
            sortingField: 'requestedOn',
            width: '20%'
          },
        ]}
        items={filteredExtractions}
        selectionType="single"
        selectedItems={selectedItems}
        onSelectionChange={handleSelectionChange}
        filter={
          <TextFilter
            filteringText={filterText}
            filteringPlaceholder="Find extractions"
            filteringAriaLabel="Filter extractions"
            onChange={({ detail }) => setFilterText(detail.filteringText)}
            countText={`${filteredExtractions.length} matches`}
          />
        }
        pagination={
          <Pagination
            currentPageIndex={currentPageIndex}
            onChange={({ detail }) => setCurrentPageIndex(detail.currentPageIndex)}
            pagesCount={Math.ceil(filteredExtractions.length / pageSize)}
            ariaLabels={{
              nextPageLabel: 'Next page',
              previousPageLabel: 'Previous page',
              pageLabel: pageNumber => `Page ${pageNumber} of all pages`
            }}
          />
        }
        preferences={
          <CollectionPreferences
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            onConfirm={({ detail }) => setPageSize(detail.pageSize || 10)}
            preferences={{
              pageSize: pageSize
            }}
            pageSizePreference={{
              title: "Page size",
              options: [
                { value: 10, label: "10 extractions" },
                { value: 20, label: "20 extractions" },
                { value: 50, label: "50 extractions" }
              ]
            }}
          />
        }
        trackBy="id"
        empty={
          <Box textAlign="center" color="inherit">
            <b>No extractions found</b>
            <Box padding={{ bottom: "s" }} variant="p" color="inherit">
              No extractions match the current filter criteria.
            </Box>
          </Box>
        }
        header={
          <Header
            counter={`(${filteredExtractions.length})`}
            actions={
              <Button variant="primary">New Extraction</Button>
            }
          >
            Extractions
          </Header>
        }
        variant="full-page"
        stickyHeader
        stripedRows
      />
    </AppLayout>
  );
} 