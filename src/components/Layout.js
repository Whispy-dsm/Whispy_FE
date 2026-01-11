import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Layout.css';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleMenuClick = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: '대시보드', icon: '🏠' },
    { path: '/admin/music', label: '음악 관리', icon: '🎵' },
    { path: '/admin/announcements', label: '공지사항', icon: '📋' },
    { path: '/admin/notifications', label: '알림 발송', icon: '💬' },
    { path: '/admin/topics', label: '토픽 관리', icon: '🏷️' },
    { path: '/admin/withdrawal-reasons', label: '탈퇴 사유', icon: '📊' },
    { path: '/admin/file-upload', label: '파일 업로드', icon: '📁' },
  ];

  return (
    <div className="layout">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.svg" alt="Whispy" className="logo" />
            {sidebarOpen && <h2>Whispy Admin</h2>}
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={handleMenuClick}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            {sidebarOpen && <span>로그아웃</span>}
          </button>
        </div>
      </aside>

      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* 모바일 헤더 */}
        <div className="mobile-header">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <h1 className="mobile-title">Whispy Admin</h1>
        </div>

        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
