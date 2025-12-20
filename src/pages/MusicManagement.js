import React, { useState } from 'react';
import { createMusic, updateMusic, deleteMusic } from '../services/adminService';
import { uploadFile, deleteFile, FILE_FOLDERS } from '../services/fileService';
import '../styles/MusicManagement.css';

const MusicManagement = () => {
  const [mode, setMode] = useState('create');
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    filePath: '',
    duration: '',
    category: 'MEDITATION',
    bannerImageUrl: '',
    videoUrl: '',
  });

  const categories = [
    'MEDITATION',
    'SLEEP',
    'FOCUS',
    'RELAX',
    'NATURE',
    'RAIN',
    'OCEAN',
    'FOREST',
    'THUNDER',
    'FIRE',
    'WIND',
    'PIANO',
    'OTHER'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const setUploadingState = field === 'filePath' ? setUploadingFile :
                              field === 'bannerImageUrl' ? setUploadingBanner :
                              setUploadingVideo;

    const folder = field === 'filePath' ? FILE_FOLDERS.MUSIC :
                  field === 'bannerImageUrl' ? FILE_FOLDERS.MUSIC_BANNER :
                  FILE_FOLDERS.MUSIC_VIDEO;

    setUploadingState(true);
    setMessage({ type: '', text: '' });

    try {
      // 기존 파일이 있으면 먼저 삭제
      const existingUrl = formData[field];
      if (existingUrl) {
        try {
          // URL에서 파일명 추출 (마지막 / 이후)
          const fileName = existingUrl.split('/').pop();
          await deleteFile(folder, fileName);
        } catch (deleteError) {
          // 삭제 실패해도 계속 진행
        }
      }

      const response = await uploadFile(file, folder);
      setFormData({ ...formData, [field]: response.fileUrl });
      setMessage({ type: 'success', text: `파일 업로드 성공: ${file.name}` });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '파일 업로드 실패' });
    } finally {
      setUploadingState(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      filePath: '',
      duration: '',
      category: 'MEDITATION',
      bannerImageUrl: '',
      videoUrl: '',
    });
    setMessage({ type: '', text: '' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { id, ...createData } = formData;
      await createMusic({
        ...createData,
        duration: parseInt(createData.duration),
      });
      setMessage({ type: 'success', text: '음악이 성공적으로 생성되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '음악 생성 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await updateMusic({
        ...formData,
        id: parseInt(formData.id),
        duration: parseInt(formData.duration),
      });
      setMessage({ type: 'success', text: '음악이 성공적으로 수정되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '음악 수정 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!window.confirm('정말 이 음악을 삭제하시겠습니까?')) {
      setLoading(false);
      return;
    }

    try {
      await deleteMusic(parseInt(formData.id));
      setMessage({ type: 'success', text: '음악이 성공적으로 삭제되었습니다!' });
      resetForm();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '음악 삭제 실패' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="music-management">
      <h1 className="page-title">음악 관리</h1>

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
              <label htmlFor="id">음악 ID *</label>
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
                  placeholder="음악 제목을 입력하세요"
                />
              </div>

              <div className="form-group">
                <label htmlFor="musicFile">음악 파일 *</label>
                <input
                  type="file"
                  id="musicFile"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, 'filePath')}
                  disabled={loading || uploadingFile}
                />
                {uploadingFile && <span className="uploading-text">업로드 중...</span>}
                {formData.filePath && (
                  <div className="file-preview">
                    <span>✓ 업로드됨: {formData.filePath}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="duration">재생 시간 (초) *</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  required
                  disabled={loading}
                  placeholder="예: 180 (3분)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">카테고리 *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="bannerImage">배너 이미지 (선택)</label>
                <input
                  type="file"
                  id="bannerImage"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'bannerImageUrl')}
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

              <div className="form-group">
                <label htmlFor="videoFile">비디오 파일 (선택)</label>
                <input
                  type="file"
                  id="videoFile"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'videoUrl')}
                  disabled={loading || uploadingVideo}
                />
                {uploadingVideo && <span className="uploading-text">업로드 중...</span>}
                {formData.videoUrl && (
                  <div className="file-preview">
                    <span>✓ 업로드됨: {formData.videoUrl}</span>
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

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || uploadingFile || uploadingBanner || uploadingVideo}
          >
            {loading ? '처리 중...' :
             mode === 'create' ? '음악 생성' :
             mode === 'update' ? '음악 수정' :
             '음악 삭제'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MusicManagement;
