import React from 'react';
import AppLayout from "@cloudscape-design/components/app-layout";
import Breadcrumbs from "../../../core/components/breadcrumbs/Breadcrumbs";
import Navigation from "../../../core/components/navigation/Navigation";
import HelpPanelContent from "../../../core/components/help/HelpPanelContent";
import OnboardingTable from "../../components/OnboardingTable";

function OnboardingList() {
  return (
    <AppLayout
      headerSelector="#top-nav"
      content={<OnboardingTable />}
      breadcrumbs={
        <Breadcrumbs action="View" href="/onboarding" type="Onboarding List" />
      }
      navigation={<Navigation />}
      tools={<HelpPanelContent />}
    />
  );
}

export default OnboardingList; 