import { AppLayout } from "@cloudscape-design/components";
import TopNavigation from "../navigation/TopNavigation";
import Breadcrumbs from "../breadcrumbs/Breadcrumbs";
import Navigation from "../navigation/Navigation";
import HelpPanel from "../help/HelpPanel";
import ErrorContent from "./ErrorContent";

function ErrorPage() {
  return (
    <>
      <TopNavigation />
      <AppLayout
        headerSelector="#top-nav"
        content={<ErrorContent />}
        breadcrumbs={<Breadcrumbs action="Home" href="/" type="Return home" />}
        navigation={<Navigation />}
        tools={<HelpPanel />}
      />
    </>
  );
}

export default ErrorPage; 