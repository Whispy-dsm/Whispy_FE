import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const cards = [
    { title: '음악 관리', icon: '🎵', path: '/admin/music', description: '음악 추가, 수정, 삭제' },
    { title: '공지사항', icon: '📢', path: '/admin/announcements', description: '공지사항 관리' },
    { title: '알림 발송', icon: '🔔', path: '/admin/notifications', description: '사용자에게 알림 전송' },
    { title: '토픽 관리', icon: '🏷️', path: '/admin/topics', description: 'FCM 토픽 관리' },
    { title: '탈퇴 사유', icon: '📋', path: '/admin/withdrawal-reasons', description: '사용자 피드백 조회' },
  ];

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">관리자 대시보드</h1>
      <p className="dashboard-subtitle">Whispy 관리자 패널에 오신 것을 환영합니다</p>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <Link key={card.path} to={card.path} className="dashboard-card">
            <div className="card-icon">{card.icon}</div>
            <h3 className="card-title">{card.title}</h3>
            <p className="card-description">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
