import React, { useState } from 'react';
import { createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/adminService';
import { uploadFile, deleteFile, FILE_FOLDERS } from '../services/fileService';
import '../styles/AnnouncementManagement.css';

const AnnouncementManagement = () => {
  const [mode, setMode] = useState('create');
  const [loading, setLoading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    content: '',
    bannerImageUrl: '',
  });

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
      setMessage({ type: 'success', text: `배너 이미지 업로드 성공: ${file.name}` });
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
    setMessage({ type: '', text: '' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { id, ...createData } = formData;
      await createAnnouncement(createData);
      setMessage({ type: 'success', text: '공지사항이 성공적으로 생성되었습니다!' });
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
      setMessage({ type: 'success', text: '공지사항이 성공적으로 수정되었습니다!' });
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
      setMessage({ type: 'success', text: '공지사항이 성공적으로 삭제되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '공지사항 삭제 실패' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="announcement-management">
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

      <div className="form-container">
        <form onSubmit={mode === 'create' ? handleCreate : mode === 'update' ? handleUpdate : handleDelete}>
          {(mode === 'update' || mode === 'delete') && (
            <div className="form-group">
              <label htmlFor="id">공지사항 ID *</label>
              <input
                type="number"
                id="id"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                required
                disabled={loading}
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
