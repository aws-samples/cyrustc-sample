import { 
  Header,
  Table,
  Box,
  Button,
  Pagination,
  TextFilter,
  CollectionPreferences
} from '@cloudscape-design/components';
import { AppLayout } from '@/features/app/ui/app-layout';
import { useState } from 'react';

// Mock data for development
const mockExtractions = [
  {
    id: 'EXT-001',
    customer: 'Acme Inc.',
    status: 'Completed',
    requestedOn: '2023-10-15T14:30:00Z'
  },
  {
    id: 'EXT-002',
    customer: 'Globex Corp',
    status: 'In Progress',
    requestedOn: '2023-10-16T09:45:00Z'
  },
  {
    id: 'EXT-003',
    customer: 'Initech',
    status: 'Failed',
    requestedOn: '2023-10-16T11:20:00Z'
  },
  {
    id: 'EXT-004',
    customer: 'Massive Dynamic',
    status: 'Completed',
    requestedOn: '2023-10-17T08:15:00Z'
  },
  {
    id: 'EXT-005',
    customer: 'Stark Industries',
    status: 'In Progress',
    requestedOn: '2023-10-17T16:30:00Z'
  }
];

// Format the date in a user-friendly way
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

export default function ExtractionsPage() {
  // State for table controls
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [filterText, setFilterText] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter the data based on the filter text
  const filteredExtractions = mockExtractions.filter(
    item => 
      item.id.toLowerCase().includes(filterText.toLowerCase()) ||
      item.customer.toLowerCase().includes(filterText.toLowerCase()) ||
      item.status.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <AppLayout activePage="extractions">
      <Table
        columnDefinitions={[
          {
            id: 'id',
            header: 'Unique ID',
            cell: item => item.id,
            sortingField: 'id'
          },
          {
            id: 'customer',
            header: 'Customer',
            cell: item => item.customer,
            sortingField: 'customer'
          },
          {
            id: 'status',
            header: 'Status',
            cell: item => item.status,
            sortingField: 'status'
          },
          {
            id: 'requestedOn',
            header: 'Requested On',
            cell: item => formatDate(item.requestedOn),
            sortingField: 'requestedOn'
          },
        ]}
        items={filteredExtractions}
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems)}
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