import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { useUserAuth } from "./hooks/useAuth";
import { useTheme } from "./hooks/useTheme";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { user, userRole, isLoading, logIn, signUp, logOut } = useUserAuth();

  // Apply dark/light theme
  useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Router>
        <Routes>
          {/* Login - Always accessible */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to={userRole === "admin" ? "/admin-dashboard" : "/dashboard"} replace />
              ) : (
                <LoginPage onSignIn={logIn} isLoading={isLoading} />
              )
            }
          />

          {/* Register - Always accessible */}
          <Route
            path="/register"
            element={
              user ? (
                <Navigate to={userRole === "admin" ? "/admin-dashboard" : "/dashboard"} replace />
              ) : (
                <RegisterPage onSignUp={signUp} isLoading={isLoading} />
              )
            }
          />

          {/* User Dashboard - Protected */}
          <Route
            path="/dashboard"
            element={
              user ? (
                userRole === "admin" ? (
                  <Navigate to="/admin-dashboard" replace />
                ) : (
                  <Dashboard user={user} onSignOut={logOut} />
                )
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Admin Dashboard - Protected */}
          <Route
            path="/admin-dashboard"
            element={
              user && userRole === "admin" ? (
                <AdminDashboard user={user} onSignOut={logOut} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Forgot/Reset Password - Always accessible */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Root path and catch-all - Redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <ToastContainer />
      </Router>
    </div>
  );
}

export default App;