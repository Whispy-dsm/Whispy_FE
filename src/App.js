import React, { useEffect } from "react";
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

const HEALTH_CHECK_INTERVAL = 10000; // 10초

function App() {
  useEffect(() => {
    // 환경변수로 헬스체크 활성화 여부 확인
    if (process.env.REACT_APP_ENABLE_HEALTH_CHECK !== 'true') {
      return;
    }

    // 헬스체크 함수
    const performHealthCheck = async () => {
      try {
        await fetch(`${process.env.REACT_APP_API_BASE_URL}/health`, {
          method: "GET",
          mode: "no-cors",
        });
        console.log("Health check sent:", new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Health check failed:", error);
      }
    };

    // 초기 헬스체크
    performHealthCheck();

    // 10초마다 헬스체크 수행
    const intervalId = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);

    // 클린업 함수
    return () => clearInterval(intervalId);
  }, []);

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

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
