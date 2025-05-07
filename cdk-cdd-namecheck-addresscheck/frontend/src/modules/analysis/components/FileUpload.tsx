import { FileUpload as CloudscapeFileUpload } from "@cloudscape-design/components";
import { useAnalysisUpload } from "../hooks/useAnalysisUpload";

export function FileUpload() {
  const { loading, error, uploadFiles } = useAnalysisUpload();

  const handleFileChange = (e: { detail: { value: File[] } }) => {
    uploadFiles(e.detail.value);
  };

  return (
    <CloudscapeFileUpload
      onChange={handleFileChange}
      value={[]}
      i18nStrings={{
        dropzoneText: (multiple) => 
          multiple ? "Drop files here" : "Drop file here",
        browseFilesText: (multiple) => 
          multiple ? "Choose files" : "Choose file",
        removeFileAriaLabel: (e) => `Remove ${e}`,
        limitShowFewer: "Show fewer files",
        limitShowMore: "Show more files",
        errorIconAriaLabel: "Error"
      }}
      constraintText="File size up to 25MB"
      showFileLastModified
      showFileSize
      multiple
      disabled={loading}
      accept=".pdf"
      errorText={error}
    />
  );
} 