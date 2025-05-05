import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy } from 'react'

const DashboardPage = lazy(() => import('@/pages/dashboard'))
const ExtractionsPage = lazy(() => import('@/pages/extractions'))

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<DashboardPage />}
      />
      <Route
        path="/extractions"
        element={<ExtractionsPage />}
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}