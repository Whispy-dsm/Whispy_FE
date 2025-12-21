import React, { useState, useEffect } from 'react';
import { getAllAnnouncements, getAnnouncementDetail, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/adminService';
import { uploadFile, deleteFile, FILE_FOLDERS } from '../services/fileService';
import Toast from '../components/Toast';
import '../styles/AnnouncementManagement.css';

const AnnouncementManagement = () => {
  const [mode, setMode] = useState('create');
  const [loading, setLoading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    content: '',
    bannerImageUrl: '',
  });

  useEffect(() => {
    if (mode === 'update' || mode === 'delete') {
      loadAnnouncements();
    }
  }, [mode]);

  const loadAnnouncements = async () => {
    try {
      const response = await getAllAnnouncements(0, 100);
      setAnnouncements(response.content || []);
    } catch (error) {
      setMessage({ type: 'error', text: '공지사항 목록 불러오기 실패' });
    }
  };

  const handleAnnouncementSelect = async (announcement) => {
    setSelectedAnnouncement(announcement);
    setMessage({ type: '', text: '' });

    // 목록에서 이미 모든 정보를 가지고 있으므로 바로 폼에 설정
    setFormData({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      bannerImageUrl: announcement.bannerImageUrl || '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingBanner(true);
    setMessage({ type: '', text: '' });

    try {
      // 기존 배너가 있으면 먼저 삭제
      if (formData.bannerImageUrl) {
        try {
          const fileName = formData.bannerImageUrl.split('/').pop();
          await deleteFile(FILE_FOLDERS.ANNOUNCEMENT_BANNER, fileName);
        } catch (deleteError) {
          // 삭제 실패해도 계속 진행
        }
      }

      const response = await uploadFile(file, FILE_FOLDERS.ANNOUNCEMENT_BANNER);
      setFormData({ ...formData, bannerImageUrl: response.fileUrl });
      setToast({ type: 'success', text: `배너 이미지 업로드 성공: ${file.name}` });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '배너 이미지 업로드 실패' });
    } finally {
      setUploadingBanner(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      content: '',
      bannerImageUrl: '',
    });
    setSelectedAnnouncement(null);
    setMessage({ type: '', text: '' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { id, ...createData } = formData;
      await createAnnouncement(createData);
      setToast({ type: 'success', text: '공지사항이 성공적으로 생성되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '공지사항 생성 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateAnnouncement({
        ...formData,
        id: parseInt(formData.id),
      });
      setToast({ type: 'success', text: '공지사항이 성공적으로 수정되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '공지사항 수정 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!window.confirm('정말 이 공지사항을 삭제하시겠습니까?')) {
      setLoading(false);
      return;
    }

    try {
      await deleteAnnouncement(parseInt(formData.id));
      setToast({ type: 'success', text: '공지사항이 성공적으로 삭제되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '공지사항 삭제 실패' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="announcement-management">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <h1 className="page-title">공지사항 관리</h1>

      <div className="mode-selector">
        <button
          className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
          onClick={() => { setMode('create'); resetForm(); }}
        >
          새로 만들기
        </button>
        <button
          className={`mode-btn ${mode === 'update' ? 'active' : ''}`}
          onClick={() => { setMode('update'); resetForm(); }}
        >
          수정하기
        </button>
        <button
          className={`mode-btn ${mode === 'delete' ? 'active' : ''}`}
          onClick={() => { setMode('delete'); resetForm(); }}
        >
          삭제하기
        </button>
      </div>

      {(mode === 'update' || mode === 'delete') && (
        <div className="list-section">
          <h2>공지사항 목록</h2>
          <input
            type="text"
            placeholder="ID, 제목, 내용으로 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="search-input"
          />
          <div className="items-list">
            {announcements
              .filter(item =>
                searchKeyword === '' ||
                item.id.toString().includes(searchKeyword) ||
                item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                item.content.toLowerCase().includes(searchKeyword.toLowerCase())
              )
              .map((announcement) => (
                <div
                  key={announcement.id}
                  className={`list-item ${selectedAnnouncement?.id === announcement.id ? 'selected' : ''}`}
                  onClick={() => handleAnnouncementSelect(announcement)}
                >
                  <div className="item-id">ID: {announcement.id}</div>
                  <div className="item-title">{announcement.title}</div>
                  <div className="item-date">{new Date(announcement.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="form-container">
        <form onSubmit={mode === 'create' ? handleCreate : mode === 'update' ? handleUpdate : handleDelete}>
          {(mode === 'update' || mode === 'delete') && (
            <div className="form-group">
              <label htmlFor="id">선택된 공지사항 ID</label>
              <input
                type="number"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                required
                disabled={true}
              />
            </div>
          )}

          {mode !== 'delete' && (
            <>
              <div className="form-group">
                <label htmlFor="title">제목 *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength="200"
                  required
                  disabled={loading}
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">내용 *</label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  maxLength="10000"
                  rows="10"
                  required
                  disabled={loading}
                  placeholder="공지사항 내용을 입력하세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="bannerImage">배너 이미지 (선택)</label>
                <input
                  type="file"
                  id="bannerImage"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  disabled={loading || uploadingBanner}
                />
                {uploadingBanner && <span className="uploading-text">업로드 중...</span>}
                {formData.bannerImageUrl && (
                  <div className="file-preview">
                    <img src={formData.bannerImageUrl} alt="배너 미리보기" className="preview-image" />
                    <span>✓ 업로드됨</span>
                  </div>
                )}
              </div>
            </>
          )}

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading || uploadingBanner}>
            {loading ? '처리 중...' :
             mode === 'create' ? '공지사항 생성' :
             mode === 'update' ? '공지사항 수정' :
             '공지사항 삭제'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementManagement;
