import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from "@cloudscape-design/components/app-layout";
import Breadcrumbs from "../../../core/components/breadcrumbs/Breadcrumbs";
import Navigation from "../../../core/components/navigation/Navigation";
import HelpPanelContent from "../../../core/components/help/HelpPanelContent";
import { useOnboardingDetails } from '../../hooks/useOnboardingDetails';
import { useAnalysisDetails } from '../../../analysis/hooks/useAnalysisDetails';
import {
  Container,
  Header,
  SpaceBetween,
  StatusIndicator,
  ColumnLayout,
  Box,
  Button,
  Table,
  TableProps,
  Link,
  Spinner,
  Flashbar,
  FlashbarProps,
  Icon,
  Tabs,
  Modal,
  FormField,
  Textarea,
  ExpandableSection,
} from '@cloudscape-design/components';
import { ObjectData, AnalysisResult } from "../../types";
import { analysisService } from '../../../analysis/services/analysisService';
import { NameAddressVerificationResult } from '../../../onboarding/types/index';
import { onboardingService } from '../../services/onboardingService';
import LoadingBar from "@cloudscape-design/chat-components/loading-bar";
import LiveRegion from "@cloudscape-design/components/live-region";

// Add this helper function to format tokens
function formatTokens(input: string, output: string) {
  return `${parseInt(input).toLocaleString()} / ${parseInt(output).toLocaleString()}`;
}

// Add cost calculation helper function
function calculateCost(inputTokens: string, outputTokens: string): string {
  const inputCost = (parseInt(inputTokens) / 1000) * 0.003;
  const outputCost = (parseInt(outputTokens) / 1000) * 0.015;
  const totalCost = inputCost + outputCost;
  return `$${totalCost.toFixed(4)}`;
}

// Add this component for the Assistant Check tab
function AssistantCheckContent({ analysisResults }: { analysisResults?: AnalysisResult[] }) {
  if (!analysisResults || !Array.isArray(analysisResults)) {
    return (
      <Box textAlign="center" color="inherit">
        <b>No analysis results available</b>
        <Box padding={{ bottom: 's' }} variant="p" color="inherit">
          No Assistant analysis has been performed yet.
        </Box>
      </Box>
    );
  }

  return (
    <SpaceBetween size="l">
      {analysisResults.map((result, index) => {
        let parsedResult: any;
        try {
          parsedResult = JSON.parse(result.result);
        } catch (error) {
          console.error('Error parsing result:', error);
          return null;
        }

        return (
          <Container
            key={index}
            header={
              <Header
                variant="h2"
                description={
                  <SpaceBetween direction="horizontal" size="xs">
                    <span>Tokens: {formatTokens(result.inputToken, result.outputToken)}</span>
                    <span>•</span>
                    <span>Cost for this rule: {calculateCost(result.inputToken, result.outputToken)}</span>
                  </SpaceBetween>
                }
              >
                {result.analysis === 'verify-name-address' ? 'Name and Address Verification' : result.analysis}
              </Header>
            }
          >
            {result.analysis === 'verify-name-address' ? (
              <SpaceBetween size="l">
                {/* Document Section */}
                <Container header={<Header variant="h3">Document Information</Header>}>
                  <ColumnLayout columns={2} variant="text-grid">
                    <div>
                      <Box variant="awsui-key-label">Name in Document</Box>
                      <div>{parsedResult.document.name}</div>
                    </div>
                    <div>
                      <Box variant="awsui-key-label">Address in Document</Box>
                      <div>{parsedResult.document.address}</div>
                    </div>
                  </ColumnLayout>
                </Container>

                {/* Verification Results with Thinking Process in Footer */}
                <Container
                  header={<Header variant="h3">Verification Results</Header>}
                  footer={
                    result.thinking && (
                      <ExpandableSection
                        variant="footer"
                        header="Assistant's Analysis Process"
                      >
                        <Box color="text-body-secondary">
                          {result.thinking.split('\n').map((line: string, i: number) => (
                            <div 
                              key={i} 
                              style={{ 
                                marginBottom: line.startsWith('Step') ? '1em' : '0.5em',
                                fontWeight: line.startsWith('Step') ? 'bold' : 'normal'
                              }}
                            >
                              {line}
                            </div>
                          ))}
                        </Box>
                      </ExpandableSection>
                    )
                  }
                >
                  <SpaceBetween size="l">
                    <div>
                      <SpaceBetween direction="horizontal" size="xs">
                        <Box variant="awsui-key-label">Name Verification</Box>
                        <StatusIndicator type={parsedResult.analysis.name.match ? "success" : "error"}>
                          {parsedResult.analysis.name.match ? "Match" : "Mismatch"}
                        </StatusIndicator>
                      </SpaceBetween>
                      {parsedResult.analysis.name.reason && (
                        <Box variant="p" color="text-body-secondary">
                          {parsedResult.analysis.name.reason}
                        </Box>
                      )}
                    </div>
                    <div>
                      <SpaceBetween direction="horizontal" size="xs">
                        <Box variant="awsui-key-label">Address Verification</Box>
                        <StatusIndicator type={parsedResult.analysis.address.match ? "success" : "error"}>
                          {parsedResult.analysis.address.match ? "Match" : "Mismatch"}
                        </StatusIndicator>
                      </SpaceBetween>
                      {parsedResult.analysis.address.reason && (
                        <Box variant="p" color="text-body-secondary">
                          {parsedResult.analysis.address.reason}
                        </Box>
                      )}
                    </div>
                  </SpaceBetween>
                </Container>
              </SpaceBetween>
            ) : (
              // For other types of analysis results
              <Box padding={{ vertical: 's' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(parsedResult, null, 2)}
                </pre>
              </Box>
            )}
          </Container>
        );
      })}
    </SpaceBetween>
  );
}

function OnboardingDetails() {
  const { id } = useParams<{ id: string }>();
  const { 
    onboarding, 
    loading: onboardingLoading, 
    error: onboardingError 
  } = useOnboardingDetails(id!);
  const { 
    analysis, 
    loading: analysisLoading, 
    error: analysisError 
  } = useAnalysisDetails(onboarding?.analysisId);

  const [loadingDocument, setLoadingDocument] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState("details");
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [isClarificationModalVisible, setIsClarificationModalVisible] = useState(false);
  const [clarificationNote, setClarificationNote] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);

  const handleDocumentClick = async (objectKey: string) => {
    try {
      setLoadingDocument(objectKey);
      const response = await analysisService.getDocumentUrl(objectKey);
      window.open(response.url, '_blank');
    } catch (error) {
      console.error('Error getting document URL:', error);
      // You might want to show an error notification here
    } finally {
      setLoadingDocument(null);
    }
  };

  // Move column definitions inside component to access analysis state
  const DOCUMENT_COLUMN_DEFINITIONS: TableProps.ColumnDefinition<ObjectData>[] = [
    {
      id: "order",
      header: "Order",
      cell: (item: ObjectData) => {
        const items = analysis?.objectsData || [];
        return items.indexOf(item) + 1;
      },
    },
    {
      id: "key",
      header: "Document Key",
      cell: (item: ObjectData) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Link
            href="#"
            onFollow={() => handleDocumentClick(item.object)}
          >
            {item.object}
          </Link>
          {loadingDocument === item.object && <Spinner size="normal" />}
        </SpaceBetween>
      ),
    },
    {
      id: "pageCount",
      header: "No of Page",
      cell: (item: ObjectData) => item.numberOfPages,
    },
    {
      id: "tokens",
      header: "Token (Input / Output)",
      cell: (item: ObjectData) => formatTokens(item.tokenInput, item.tokenOutput),
    },
    {
      id: "cost",
      header: "Assistant Cost",
      cell: (item: ObjectData) => calculateCost(item.tokenInput, item.tokenOutput),
    },
  ];

  const getAnalysisFlashbarItems = (): FlashbarProps.MessageDefinition[] => {
    if (!analysis?.analysisResults || !Array.isArray(analysis.analysisResults)) return [];

    const verificationResult = analysis.analysisResults.find(
      result => result.analysis === "verify-name-address"
    );

    if (!verificationResult?.result) return [];

    try {
      const parsedResult: NameAddressVerificationResult = JSON.parse(verificationResult.result);
      const { name, address } = parsedResult.analysis;

      if (name.match && address.match) {
        return [{
          type: "info",
          content: "Assistant verification passed: Name and address match with the documents.",
          dismissible: true,
          dismissLabel: "Dismiss message",
          id: "verification_success"
        }];
      }

      const warnings: string[] = [];
      if (!name.match) {
        warnings.push(`Name mismatch: ${name.reason}`);
      }
      if (!address.match) {
        warnings.push(`Address mismatch: ${address.reason || 'No specific reason provided'}`);
      }

      return [{
        type: "warning",
        content: (
          <SpaceBetween size="xs">
            <div>Potential issues/ discrepancies:</div>
            {warnings.map((warning, index) => (
              <div key={index}>{warning}</div>
            ))}
          </SpaceBetween>
        ),
        buttonText: "Seek Clarification",
        onButtonClick: () => {
          setIsClarificationModalVisible(true);
          generateEmailContent(warnings);
        },
        dismissible: true,
        dismissLabel: "Dismiss message",
        id: "verification_warning"
      }];
    } catch (error) {
      console.error('Error parsing verification result:', error);
      return [{
        type: "error",
        content: "Error processing verification results",
        dismissible: true,
        dismissLabel: "Dismiss message",
        id: "verification_error"
      }];
    }
  };

  const getVerificationStatus = () => {
    if (!analysis?.analysisResults || !Array.isArray(analysis.analysisResults)) {
      return { nameMatch: true, addressMatch: true };
    }

    const verificationResult = analysis.analysisResults.find(
      result => result.analysis === "verify-name-address"
    );

    if (!verificationResult?.result) {
      return { nameMatch: true, addressMatch: true };
    }

    try {
      const parsedResult: NameAddressVerificationResult = JSON.parse(verificationResult.result);
      return {
        nameMatch: parsedResult.analysis.name.match,
        addressMatch: parsedResult.analysis.address.match
      };
    } catch (error) {
      console.error('Error parsing verification result:', error);
      return { nameMatch: true, addressMatch: true };
    }
  };

  const handleApprove = () => {
    setIsApprovalModalVisible(true);
  };

  const handleApprovalConfirm = () => {
    // Add your approval logic here
    console.log('Approving with note:', approvalNote);
    setIsApprovalModalVisible(false);
    setApprovalNote('');
  };

  const handleClarificationSubmit = () => {
    // Add your clarification submission logic here
    console.log('Sending clarification:', clarificationNote);
    setIsClarificationModalVisible(false);
    setClarificationNote('');
  };

  const { nameMatch, addressMatch } = getVerificationStatus();
  const hasAIWarnings = !nameMatch || !addressMatch;

  // Add this function to generate email content
  const generateEmailContent = async (warnings: string[]) => {
    try {
      setGeneratingEmail(true);
      const issues = warnings.join('\n');
      const response = await onboardingService.generateEmail(issues);
      setClarificationNote(response.content);
    } catch (error) {
      console.error('Error generating email content:', error);
      // You might want to show an error notification here
    } finally {
      setGeneratingEmail(false);
    }
  };

  // Separate error handling for each section
  if (onboardingError) {
    return (
      <Box margin={{ bottom: 'l' }}>
        <StatusIndicator type="error">
          Error loading onboarding details: {onboardingError.message}
        </StatusIndicator>
      </Box>
    );
  }

  return (
    <AppLayout
      headerSelector="#top-nav"
      breadcrumbs={
        <Breadcrumbs 
          action="Details" 
          href={`/onboarding/${id}`} 
          type="Onboarding Request" 
        />
      }
      navigation={<Navigation />}
      tools={<HelpPanelContent />}
      content={
        <SpaceBetween size="l">
          {/* Application ID Header */}
          <Header variant="h1">
            Application: {onboarding?.requestId}
          </Header>

          {/* Analysis Results Flashbar */}
          <Flashbar items={getAnalysisFlashbarItems()} />

          {/* Basic Info Container */}
          <Container
            header={
              <Header
                variant="h2"
                info={
                  onboarding && (
                    <StatusIndicator type={getStatusType(onboarding.status)}>
                      {onboarding.status}
                    </StatusIndicator>
                  )
                }
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button 
                      onClick={handleApprove}
                      disabled={
                        analysisLoading || 
                        !analysis || 
                        onboarding?.status !== "READY_TO_CHECK"
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      disabled={
                        analysisLoading || 
                        !analysis || 
                        onboarding?.status !== "READY_TO_CHECK"
                      }
                    >
                      Reject
                    </Button>
                  </SpaceBetween>
                }
              >
                Onboarding Details
              </Header>
            }
          >
            {onboardingLoading ? (
              <StatusIndicator type="loading">Loading onboarding details...</StatusIndicator>
            ) : onboarding && (
              <ColumnLayout columns={2} variant="text-grid">
                <div>
                  <Box variant="awsui-key-label">ID</Box>
                  <div>{onboarding.requestId}</div>
                </div>
                <div>
                  <Box variant="awsui-key-label">Created At</Box>
                  <div>{new Date(onboarding.createdAt).toLocaleString()}</div>
                </div>
              </ColumnLayout>
            )}
          </Container>

          {/* Updated Modal */}
          <Modal
            onDismiss={() => setIsApprovalModalVisible(false)}
            visible={isApprovalModalVisible}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setIsApprovalModalVisible(false);
                      setApprovalNote('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleApprovalConfirm}
                    disabled={hasAIWarnings && !approvalNote.trim()}
                  >
                    Confirm Approval
                  </Button>
                </SpaceBetween>
              </Box>
            }
            header="Confirm Approval"
          >
            <SpaceBetween size="l">
              {hasAIWarnings && (
                <Flashbar
                  items={[
                    {
                      type: "warning",
                      content: "Potential issue flagged by Assistant. Share your finding to override.",
                      dismissible: false,
                    }
                  ]}
                />
              )}
              
              <Box variant="p">
                Are you sure you want to approve this onboarding request?
              </Box>

              {hasAIWarnings && (
                <FormField
                  label="Approval Note"
                  description="Please provide a reason for approving despite Assistant warnings"
                  errorText={
                    approvalNote.trim() ? undefined : "Note is required when overriding Assistant warnings"
                  }
                >
                  <Textarea
                    value={approvalNote}
                    onChange={({ detail }) => setApprovalNote(detail.value)}
                    placeholder="Enter your findings and reason for approval"
                    rows={3}
                  />
                </FormField>
              )}
            </SpaceBetween>
          </Modal>

          {/* Update the Clarification Modal */}
          <Modal
            onDismiss={() => {
              setIsClarificationModalVisible(false);
              setClarificationNote('');
            }}
            visible={isClarificationModalVisible}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setIsClarificationModalVisible(false);
                      setClarificationNote('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleClarificationSubmit}
                    disabled={!clarificationNote.trim() || generatingEmail}
                  >
                    Send Clarification Request
                  </Button>
                </SpaceBetween>
              </Box>
            }
            header="Seek Clarification"
          >
            {generatingEmail ? (
              <LiveRegion>
                <Box
                  margin={{ bottom: "xs", left: "l" }}
                  color="text-body-secondary"
                >
                  Generating email content
                </Box>
                <LoadingBar variant="gen-ai" />
              </LiveRegion>
            ) : (
              <FormField
                label="Clarification Request"
                description="Please provide details about what information you need from the applicant"
                errorText={
                  clarificationNote.trim() ? undefined : "Clarification note is required"
                }
              >
                <Textarea
                  value={clarificationNote}
                  onChange={({ detail }) => setClarificationNote(detail.value)}
                  placeholder="Enter your clarification request message"
                  rows={20}
                  disabled={generatingEmail}
                />
              </FormField>
            )}
          </Modal>

          {/* Tabs Section */}
          <Tabs
            activeTabId={activeTabId}
            onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
            tabs={[
              {
                id: "details",
                label: "Details",
                content: (
                  <Container
                    header={<Header variant="h2">Personal Information</Header>}
                  >
                    {onboardingLoading ? (
                      <StatusIndicator type="loading">Loading details...</StatusIndicator>
                    ) : onboarding && (
                      <ColumnLayout columns={2} variant="text-grid">
                        <SpaceBetween size="l">
                          <div>
                            <Box variant="awsui-key-label">Email</Box>
                            <div>{onboarding.email}</div>
                          </div>
                          <div>
                            <Box variant="awsui-key-label">First Name</Box>
                            <SpaceBetween direction="horizontal" size="xs">
                              <div>{onboarding.firstName}</div>
                              {!nameMatch && <Icon name="flag" variant="warning" />}
                            </SpaceBetween>
                          </div>
                          <div>
                            <Box variant="awsui-key-label">Last Name</Box>
                            <SpaceBetween direction="horizontal" size="xs">
                              <div>{onboarding.lastName}</div>
                              {!nameMatch && <Icon name="flag" variant="warning" />}
                            </SpaceBetween>
                          </div>
                        </SpaceBetween>
                        <SpaceBetween size="l">
                          <div>
                            <Box variant="awsui-key-label">Phone</Box>
                            <div>{onboarding.phoneNumber}</div>
                          </div>
                          <div>
                            <Box variant="awsui-key-label">Middle Name</Box>
                            <SpaceBetween direction="horizontal" size="xs">
                              <div>{onboarding.middleName || '-'}</div>
                              {!nameMatch && <Icon name="flag" variant="warning" />}
                            </SpaceBetween>
                          </div>
                          <div>
                            <Box variant="awsui-key-label">Address</Box>
                            <SpaceBetween direction="horizontal" size="xs">
                              <div>{onboarding.address}</div>
                              {!addressMatch && <Icon name="flag" variant="warning" />}
                            </SpaceBetween>
                          </div>
                        </SpaceBetween>
                      </ColumnLayout>
                    )}
                  </Container>
                ),
              },
              {
                id: "documents",
                label: "Documents",
                content: (
                  <Container
                    header={
                      <Header 
                        variant="h2"
                        description="List of documents submitted with this application"
                      >
                        Documents
                      </Header>
                    }
                  >
                    {!onboarding?.analysisId ? (
                      <Box textAlign="center" color="inherit">
                        <b>No analysis available</b>
                        <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                          This application has no associated analysis.
                        </Box>
                      </Box>
                    ) : analysisLoading ? (
                      <StatusIndicator type="loading">Loading document analysis...</StatusIndicator>
                    ) : analysisError ? (
                      <StatusIndicator type="error">
                        Error loading document analysis: {analysisError.message}
                      </StatusIndicator>
                    ) : analysis && analysis.objectsData ? (
                      <Table
                        columnDefinitions={DOCUMENT_COLUMN_DEFINITIONS}
                        items={analysis.objectsData}
                        variant="embedded"
                        stripedRows
                        empty={
                          <Box textAlign="center" color="inherit">
                            <b>No documents</b>
                            <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                              No documents have been submitted with this application.
                            </Box>
                          </Box>
                        }
                      />
                    ) : (
                      <Box textAlign="center" color="inherit">
                        <b>No documents available</b>
                        <Box padding={{ bottom: 's' }} variant="p" color="inherit">
                          No documents found in the analysis.
                        </Box>
                      </Box>
                    )}
                  </Container>
                ),
              },
              {
                id: "assistant-check",
                label: "Assistant Check",
                content: analysisLoading ? (
                  <StatusIndicator type="loading">Loading analysis results...</StatusIndicator>
                ) : analysisError ? (
                  <StatusIndicator type="error">
                    Error loading analysis results: {analysisError.message}
                  </StatusIndicator>
                ) : (
                  <AssistantCheckContent analysisResults={analysis?.analysisResults} />
                ),
              },
            ]}
          />
        </SpaceBetween>
      }
    />
  );
}

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

export default OnboardingDetails; 