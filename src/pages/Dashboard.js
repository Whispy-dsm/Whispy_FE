import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadFile, FILE_FOLDERS } from '../services/fileService';
import Toast from '../components/Toast';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [toast, setToast] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const cards = [
    { title: '음악 관리', path: '/admin/music', description: '음악 추가, 수정, 삭제', icon: '🎵' },
    { title: '공지사항', path: '/admin/announcements', description: '공지사항 관리', icon: '📋' },
    { title: '알림 발송', path: '/admin/notifications', description: '사용자에게 알림 전송', icon: '💬' },
    { title: '토픽 관리', path: '/admin/topics', description: 'FCM 토픽 관리', icon: '🏷️' },
    { title: '탈퇴 사유', path: '/admin/withdrawal-reasons', description: '사용자 피드백 조회', icon: '📊' },
    { title: '파일 업로드', path: '/admin/file-upload', description: '파일 업로드 및 관리', icon: '📁' },
  ];

  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: '5MB 이상 파일은 업로드할 수 없습니다.' });
      e.target.value = '';
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await uploadFile(file, FILE_FOLDERS.PROFILE_IMAGE);
      setUploadedUrl(response.fileUrl);
      setToast({ type: 'success', text: `프로필 이미지 업로드 성공: ${file.name}` });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '업로드 실패' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="dashboard">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h1 className="dashboard-title">관리자 대시보드</h1>
      <p className="dashboard-subtitle">Whispy 관리자 패널에 오신 것을 환영합니다</p>

      {/* 프로필 이미지 빠른 업로드 */}
      <div className="quick-upload-section">
        <h2 className="section-title">프로필 이미지 빠른 업로드</h2>
        <div className="upload-container">
          <input
            type="file"
            id="profileUpload"
            accept="image/*"
            onChange={handleProfileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <label htmlFor="profileUpload" className={`upload-label ${uploading ? 'disabled' : ''}`}>
            {uploading ? '업로드 중...' : '+ 프로필 이미지 선택'}
          </label>
          <p className="upload-hint">이미지 파일 (최대 5MB)</p>

          {uploadedUrl && (
            <div className="uploaded-result">
              <img src={uploadedUrl} alt="업로드된 프로필" className="uploaded-preview" />
              <div className="url-copy-section">
                <input
                  type="text"
                  value={uploadedUrl}
                  readOnly
                  className="url-input"
                  onClick={(e) => e.target.select()}
                />
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedUrl);
                    setToast({ type: 'success', text: 'URL이 복사되었습니다' });
                  }}
                >
                  복사
                </button>
              </div>
            </div>
          )}

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

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
