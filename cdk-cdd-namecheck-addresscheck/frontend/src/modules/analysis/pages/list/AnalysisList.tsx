import React from 'react';
import AppLayout from "@cloudscape-design/components/app-layout";
import Breadcrumbs from "../../../core/components/breadcrumbs/Breadcrumbs";
import Navigation from "../../../core/components/navigation/Navigation";
import HelpPanelContent from "../../../core/components/help/HelpPanelContent";
import Content from "../../components/AnalysisTable";

function AnalysisList() {
  return (
    <AppLayout
      headerSelector="#top-nav"
      content={<Content />}
      breadcrumbs={
        <Breadcrumbs action="View" href="/analysis" type="Analysis List" />
      }
      navigation={<Navigation />}
      tools={<HelpPanelContent />}
    />
  );
}

export default AnalysisList;
