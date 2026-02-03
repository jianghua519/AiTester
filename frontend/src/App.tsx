import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/auth'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { MainLayout } from './components/layout/MainLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  return <MainLayout>{children}</MainLayout>
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage onNavigateToRegister={() => {}} />} />
          <Route path="/register" element={<RegisterPage onNavigateToLogin={() => {}} />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-cases" 
            element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Cases</h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Test cases management page will be implemented here.</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-suites" 
            element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Suites</h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Test suites management page will be implemented here.</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-plans" 
            element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Plans</h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Test plans management page will be implemented here.</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/test-runs" 
            element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Runs</h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Test runs management page will be implemented here.</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Projects</h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Projects management page will be implemented here.</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">Settings</h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">Settings page will be implemented here.</p>
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
