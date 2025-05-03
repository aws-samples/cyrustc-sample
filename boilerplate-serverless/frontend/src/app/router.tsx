import { Navigate, Route, Routes } from 'react-router-dom'
import { lazy } from 'react'

const DashboardPage = lazy(() => import('@/pages/dashboard'))

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<DashboardPage />}
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}