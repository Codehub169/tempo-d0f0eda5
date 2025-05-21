import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import Navbar from './components/Navbar';
import { useAuth } from './hooks/useAuth';
import './App.css';

// ProtectedRoute component to handle routes requiring authentication
const ProtectedRoute = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div className=\"loading-container\"><div className=\"loading-spinner\"></div><p>Loading...</p></div>; // Or a more sophisticated loading spinner
  }

  return isAuthenticated ? <Outlet /> : <Navigate to=\"/auth\" replace />;
};

// PublicRoute component to handle routes for unauthenticated users (e.g., login/signup)
const PublicRoute = () => {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return <div className=\"loading-container\"><div className=\"loading-spinner\"></div><p>Loading...</p></div>; // Or a more sophisticated loading spinner
  }

  return isAuthenticated ? <Navigate to=\"/dashboard\" replace /> : <Outlet />;
};

function App() {
  const { isLoadingAuth } = useAuth();

  // This initial loading state can be handled here or within routes
  // For simplicity, routes handle their specific loading/auth checks
  // if (isLoadingAuth) {
  //   return <div className=\"loading-container\"><div className=\"loading-spinner\"></div><p>Loading application...</p></div>;
  // }

  return (
    <div className=\"App\">
      <Navbar />
      <main className=\"main-content\">
        <Routes>
          {/* Routes accessible only to unauthenticated users */}
          <Route element={<PublicRoute />}>
            <Route path=\"/auth\" element={<AuthPage />} />
          </Route>

          {/* Routes accessible only to authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path=\"/dashboard\" element={<DashboardPage />} />
          </Route>

          {/* Default route handling */}
          <Route 
            path=\"/\" 
            element={isLoadingAuth ? <div className=\"loading-container\"><div className=\"loading-spinner\"></div><p>Loading...</p></div> : <NavigateToHome />}
          />
          
          {/* Catch-all for undefined routes (optional) */}
          <Route path=\"*\" element={<Navigate to=\"/\" replace />} />
        </Routes>
      </main>
    </div>
  );
}

// Helper component to determine initial redirect based on auth state
const NavigateToHome = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to=\"/dashboard\" replace /> : <Navigate to=\"/auth\" replace />;
};

export default App;
