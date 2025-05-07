// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import App from './App';
import ErrorPage from "./modules/core/components/error/ErrorPage";
import AnalysisList from './modules/analysis/pages/list/AnalysisList';
import CreateAnalysis from './modules/analysis/pages/create/CreateAnalysis';
import OnboardingList from './modules/onboarding/pages/list/OnboardingList';
import OnboardingDetails from './modules/onboarding/pages/details/OnboardingDetails';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/onboarding" />},
      { path: "/onboarding", element: <OnboardingList /> },
      { path: "/onboarding/:id", element: <OnboardingDetails /> },
      { path: "/analysis", element: <AnalysisList /> },
      { path: "/analysis/create", element: <CreateAnalysis /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
