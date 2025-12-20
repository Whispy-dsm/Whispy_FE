import React, { useState } from 'react';
import { addNewTopic } from '../services/adminService';
import '../styles/TopicManagement.css';

const TopicManagement = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    topic: '',
    defaultSubscribed: true,
  });

  // 기존 토픽 목록 (참고용)
  const existingTopics = [
    { value: 'GENERAL_ANNOUNCEMENT', label: '일반 공지사항' },
    { value: 'SYSTEM_ANNOUNCEMENT', label: '시스템 공지사항' },
    { value: 'BROADCAST_ANNOUNCEMENT', label: '브로드캐스트 공지사항' },
    { value: 'ONLY_ADMIN', label: '관리자 전용' },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await addNewTopic(formData.topic, formData.defaultSubscribed);
      setMessage({
        type: 'success',
        text: `토픽 "${formData.topic}"이(가) 성공적으로 추가되었습니다!${formData.defaultSubscribed ? ' 모든 사용자가 구독되었습니다.' : ''}`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '토픽 추가 실패' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topic-management">
      <h1 className="page-title">토픽 관리</h1>

      <div className="info-box">
        <h3>토픽 정보</h3>
        <p>
          토픽은 FCM (Firebase Cloud Messaging) 알림을 분류하고 관리하는 데 사용됩니다.
          새 토픽을 추가할 때 기존의 모든 사용자를 자동으로 구독시킬지 선택할 수 있습니다.
        </p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="topic">새 토픽 이름 *</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="예: TEST_TOPIC"
              required
              disabled={loading}
            />
            <p className="help-text">
              대문자와 언더스코어(_)를 사용하여 토픽 이름을 입력하세요. 예: NEW_FEATURE, SPECIAL_EVENT
            </p>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="defaultSubscribed"
                checked={formData.defaultSubscribed}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span>모든 사용자를 이 토픽에 기본적으로 구독</span>
            </label>
            <p className="help-text">
              체크하면 기존의 모든 사용자가 자동으로 이 토픽을 구독합니다.
            </p>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '토픽 추가 중...' : '새 토픽 추가'}
          </button>
        </form>
      </div>

      <div className="topics-list-section">
        <h2>기존 토픽 목록</h2>
        <p className="section-description">현재 시스템에 등록된 토픽입니다.</p>
        <div className="topics-grid">
          {existingTopics.map((topic) => (
            <div key={topic.value} className="topic-card">
              <span className="topic-icon">🏷️</span>
              <div className="topic-info">
                <span className="topic-name">{topic.label}</span>
                <span className="topic-value">{topic.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopicManagement;
