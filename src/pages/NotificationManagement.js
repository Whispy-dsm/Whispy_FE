import React, { useState } from 'react';
import { sendNotification, sendTopicNotification, broadcastNotification } from '../services/adminService';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/NotificationManagement.css';

const NotificationManagement = () => {
  const [mode, setMode] = useState('device');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [formData, setFormData] = useState({
    email: '',
    deviceTokens: '',
    topic: 'GENERAL_ANNOUNCEMENT',
    title: '',
    body: '',
  });

  const [dataFields, setDataFields] = useState([{ key: '', value: '' }]);

  const topics = [
    { value: 'GENERAL_ANNOUNCEMENT', label: '일반 공지사항' },
    { value: 'SYSTEM_ANNOUNCEMENT', label: '시스템 공지사항' },
    { value: 'BROADCAST_ANNOUNCEMENT', label: '브로드캐스트 공지사항' },
    { value: 'ONLY_ADMIN', label: '관리자 전용' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDataFieldChange = (index, field, value) => {
    const newDataFields = [...dataFields];
    newDataFields[index][field] = value;
    setDataFields(newDataFields);
  };

  const addDataField = () => {
    setDataFields([...dataFields, { key: '', value: '' }]);
  };

  const removeDataField = (index) => {
    if (dataFields.length > 1) {
      const newDataFields = dataFields.filter((_, i) => i !== index);
      setDataFields(newDataFields);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      deviceTokens: '',
      topic: 'GENERAL_ANNOUNCEMENT',
      title: '',
      body: '',
    });
    setDataFields([{ key: '', value: '' }]);
    setMessage({ type: '', text: '' });
  };

  const buildDataObject = () => {
    const data = {};
    dataFields.forEach(field => {
      if (field.key && field.value) {
        data[field.key] = field.value;
      }
    });
    return data;
  };

  const handleDeviceNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const tokens = formData.deviceTokens.split(',').map(t => t.trim()).filter(t => t);
      const data = buildDataObject();

      await sendNotification({
        email: formData.email,
        deviceTokens: tokens,
        topic: formData.topic,
        title: formData.title,
        body: formData.body,
        data,
      });
      setToast({ type: 'success', text: '알림이 성공적으로 전송되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '알림 전송 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleTopicNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const data = buildDataObject();

      await sendTopicNotification({
        topic: formData.topic,
        title: formData.title,
        body: formData.body,
        data,
      });
      setToast({ type: 'success', text: '토픽 알림이 성공적으로 전송되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '토픽 알림 전송 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();

    const confirmBroadcast = async () => {
      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        const data = buildDataObject();

        await broadcastNotification({
          topic: 'BROADCAST_ANNOUNCEMENT',
          title: formData.title,
          body: formData.body,
          data,
        });
        setToast({ type: 'success', text: '브로드캐스트 알림이 성공적으로 전송되었습니다!' });
        resetForm();
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || '브로드캐스트 알림 전송 실패' });
      } finally {
        setLoading(false);
      }
    };

    setConfirmModal({
      isOpen: true,
      title: '브로드캐스트 확인',
      message: '정말 모든 사용자에게 알림을 전송하시겠습니까?',
      onConfirm: confirmBroadcast,
    });
  };

  return (
    <div className="notification-management">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        danger={false}
      />

      <h1 className="page-title">알림 관리</h1>

      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'device' ? 'active' : ''}`}
          onClick={() => { setMode('device'); resetForm(); }}
        >
          디바이스 전송
        </button>
        <button
          className={`mode-btn ${mode === 'topic' ? 'active' : ''}`}
          onClick={() => { setMode('topic'); resetForm(); }}
        >
          토픽 전송
        </button>
        <button
          className={`mode-btn ${mode === 'broadcast' ? 'active' : ''}`}
          onClick={() => { setMode('broadcast'); resetForm(); }}
        >
          전체 브로드캐스트
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={
          mode === 'device' ? handleDeviceNotification :
          mode === 'topic' ? handleTopicNotification :
          handleBroadcast
        }>
          {mode === 'device' && (
            <>
              <div className="form-group">
                <label htmlFor="email">사용자 이메일 *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="user@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="deviceTokens">디바이스 토큰 (쉼표로 구분)</label>
                <textarea
                  id="deviceTokens"
                  name="deviceTokens"
                  value={formData.deviceTokens}
                  onChange={handleInputChange}
                  rows="3"
                  disabled={loading}
                  placeholder="token1, token2, token3..."
                />
              </div>
            </>
          )}

          {mode !== 'broadcast' && (
            <div className="form-group">
              <label htmlFor="topic">토픽 *</label>
              <select
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                required
                disabled={loading}
              >
                {topics.map((topic) => (
                  <option key={topic.value} value={topic.value}>{topic.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              maxLength="255"
              required
              disabled={loading}
              placeholder="알림 제목"
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">내용 *</label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              maxLength="5000"
              rows="5"
              required
              disabled={loading}
              placeholder="알림 내용"
            />
          </div>

          <div className="form-group">
            <label>추가 데이터 (선택)</label>
            {dataFields.map((field, index) => (
              <div key={index} className="data-field-row">
                <input
                  type="text"
                  value={field.key}
                  onChange={(e) => handleDataFieldChange(index, 'key', e.target.value)}
                  placeholder="키"
                  disabled={loading}
                />
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleDataFieldChange(index, 'value', e.target.value)}
                  placeholder="값"
                  disabled={loading}
                />
                {dataFields.length > 1 && (
                  <button
                    type="button"
                    className="remove-field-btn"
                    onClick={() => removeDataField(index)}
                    disabled={loading}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="add-field-btn"
              onClick={addDataField}
              disabled={loading}
            >
              + 데이터 추가
            </button>
          </div>

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '전송 중...' :
             mode === 'device' ? '디바이스에 전송' :
             mode === 'topic' ? '토픽에 전송' :
             '전체 브로드캐스트'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NotificationManagement;
