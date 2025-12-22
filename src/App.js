import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MusicManagement from "./pages/MusicManagement";
import AnnouncementManagement from "./pages/AnnouncementManagement";
import NotificationManagement from "./pages/NotificationManagement";
import WithdrawalReasons from "./pages/WithdrawalReasons";
import TopicManagement from "./pages/TopicManagement";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/music" element={<MusicManagement />} />
                    <Route path="/announcements" element={<AnnouncementManagement />} />
                    <Route path="/notifications" element={<NotificationManagement />} />
                    <Route path="/withdrawal-reasons" element={<WithdrawalReasons />} />
                    <Route path="/topics" element={<TopicManagement />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
