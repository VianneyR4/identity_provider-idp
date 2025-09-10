import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { BudgetProvider } from './contexts/BudgetContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import BudgetManagement from './pages/BudgetManagement';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/budgets" element={
                <ProtectedRoute>
                  <Layout>
                    <BudgetManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Layout>
                    <UserManagement />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute>
                  <Layout>
                    <Reports />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </BudgetProvider>
    </AuthProvider>
  );
}

export default App;
