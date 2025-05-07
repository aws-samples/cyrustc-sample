import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppLayout,
  Container,
  Header,
  SpaceBetween,
  FormField,
  Form,
  Button,
  FileUpload,
  Alert,
  ProgressBar,
  Flashbar,
} from "@cloudscape-design/components";
import Breadcrumbs from "../../../core/components/breadcrumbs/Breadcrumbs";
import Navigation from "../../../core/components/navigation/Navigation";
import HelpPanelContent from "../../../core/components/help/HelpPanelContent";
import { useAnalysisUpload } from "../../hooks/useAnalysisUpload";

function CreateAnalysis() {
  const navigate = useNavigate();
  const [files, setFiles] = React.useState<File[]>([]);
  const { loading, error, progress, uploadFiles, clearError } = useAnalysisUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await uploadFiles(files);
  };

  // Prepare flashbar items based on loading state
  const flashbarItems = React.useMemo(() => {
    if (!loading) return [];

    return [{
      content: (
        <ProgressBar
          value={progress.value}
          variant="flash"
          label="Upload Progress"
          description={progress.message}
          status={progress.status}
          additionalInfo={
            progress.status === "error" 
              ? "Upload failed. Please try again." 
              : undefined
          }
        />
      ),
      type: progress.status,
      id: "upload_progress",
      dismissible: false
    }];
  }, [loading, progress]);

  return (
    <AppLayout
      headerSelector="#top-nav"
      breadcrumbs={<Breadcrumbs action="Create" href="/analysis/create" type="Analysis" />}
      navigation={<Navigation />}
      tools={<HelpPanelContent />}
      content={
        <Container>
          <SpaceBetween size="l">
            <Header variant="h1">Create Analysis</Header>
            
            {/* Show progress bar when loading */}
            <Flashbar items={flashbarItems} />

            {/* Show error alert */}
            {error && (
              <Alert type="error" dismissible onDismiss={clearError}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Form
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button 
                      variant="link" 
                      onClick={() => navigate('/analysis')}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="primary" 
                      formAction="submit"
                      loading={loading}
                    >
                      Create analysis
                    </Button>
                  </SpaceBetween>
                }
              >
                <FormField 
                  label="Upload Documents" 
                  description="Upload one or more PDF documents for analysis. Document type will be automatically detected."
                  errorText={loading ? "Upload in progress..." : undefined}
                >
                  <FileUpload
                    onChange={({ detail }) => setFiles(detail.value)}
                    value={files}
                    i18nStrings={{
                      uploadButtonText: e => `Choose ${e ? 'different ' : ''}file(s)`,
                      dropzoneText: e => `Drop ${e ? 'different ' : ''}file(s) to upload`,
                      removeFileAriaLabel: e => `Remove ${e}`,
                      limitShowFewer: 'Show fewer files',
                      limitShowMore: 'Show more files',
                      errorIconAriaLabel: 'Error'
                    }}
                    showFileLastModified
                    showFileSize
                    showFileThumbnail
                    constraintText="PDF files only"
                    accept="application/pdf"
                    multiple
                    disabled={loading}
                  />
                </FormField>
              </Form>
            </form>
          </SpaceBetween>
        </Container>
      }
    />
  );
}

export default CreateAnalysis;