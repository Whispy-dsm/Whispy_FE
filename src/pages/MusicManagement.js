import React, { useState } from 'react';
import { getAllMusic, getMusicByCategory, getMusicDetail, createMusic, updateMusic, deleteMusic } from '../services/adminService';
import { uploadFile, deleteFile, FILE_FOLDERS } from '../services/fileService';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import '../styles/MusicManagement.css';

const MusicManagement = () => {
  const [action, setAction] = useState(null); // 'create', 'update', 'delete', null
  const [searchType, setSearchType] = useState('all'); // 'all', 'title', 'category', 'id'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('AMBIENT');

  const [musicList, setMusicList] = useState([]);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState(null);
  const [imageViewerUrl, setImageViewerUrl] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    filePath: '',
    duration: '',
    category: 'AMBIENT',
    bannerImageUrl: '',
    videoUrl: '',
  });

  const categories = [
    'AMBIENT',    // 엠비언트 사운드
    'MELODY',     // 멜로디 음악
    'NATURE',     // 자연물 소리
    'JAZZ',       // 재즈 음악
    'SLEEP',      // 수면용 음악
    'BREATHE',    // 호흡 관련 음악
    'DRONE'       // 웅웅거리는 몽환적인 느낌
  ];

  const handleSearch = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      let response;
      if (searchType === 'all') {
        // 전체 조회 - 빈 키워드로 검색
        response = await getAllMusic(0, 100, '');
      } else if (searchType === 'title') {
        response = await getAllMusic(0, 100, searchKeyword);
      } else if (searchType === 'category') {
        response = await getMusicByCategory(selectedCategory, 0, 100);
      } else if (searchType === 'id') {
        // ID로 직접 조회
        if (searchKeyword) {
          const detail = await getMusicDetail(parseInt(searchKeyword));
          setSelectedMusic({ id: parseInt(searchKeyword), ...detail });
          setMusicList([{ id: parseInt(searchKeyword), ...detail }]);
          return;
        }
      }
      setMusicList(response?.content || []);
    } catch (error) {
      setMessage({ type: 'error', text: '음악 검색 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleMusicSelect = async (music) => {
    setLoading(true);
    try {
      // 상세 정보 조회 API 호출
      const detail = await getMusicDetail(music.id);
      const musicDetail = { id: music.id, ...detail };

      setSelectedMusic(musicDetail);
      setFormData({
        id: musicDetail.id,
        title: musicDetail.title,
        filePath: musicDetail.filePath || '',
        duration: musicDetail.duration || '',
        category: musicDetail.category || 'AMBIENT',
        bannerImageUrl: musicDetail.bannerImageUrl || '',
        videoUrl: musicDetail.videoUrl || '',
      });
      setShowDetailModal(true);
    } catch (error) {
      setMessage({ type: 'error', text: '음악 상세 정보 조회 실패' });
    } finally {
      setLoading(false);
    }
  };

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
          // URL에서 파일명 추출 (쿼리 파라미터 제거)
          const urlWithoutParams = existingUrl.split('?')[0];
          const fileName = urlWithoutParams.split('/').pop();
          await deleteFile(folder, fileName);
        } catch (deleteError) {
          // 삭제 실패해도 새 파일 업로드는 계속 진행
        }
      }

      const response = await uploadFile(file, folder);

      // formData 상태를 함수형 업데이트로 변경
      setFormData(prev => ({ ...prev, [field]: response.fileUrl }));
      setToast({ type: 'success', text: `파일 업로드 성공: ${file.name}` });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '파일 업로드 실패' });
    } finally {
      setUploadingState(false);
    }
  };

  const handleFileDelete = async (field) => {
    const folder = field === 'filePath' ? FILE_FOLDERS.MUSIC :
                  field === 'bannerImageUrl' ? FILE_FOLDERS.MUSIC_BANNER :
                  FILE_FOLDERS.MUSIC_VIDEO;

    const existingUrl = formData[field];
    if (!existingUrl) return;

    if (!window.confirm('이 파일을 삭제하시겠습니까?')) {
      return;
    }

    const setUploadingState = field === 'filePath' ? setUploadingFile :
                              field === 'bannerImageUrl' ? setUploadingBanner :
                              setUploadingVideo;

    setUploadingState(true);
    setMessage({ type: '', text: '' });

    try {
      // URL에서 파일명 추출 (쿼리 파라미터 제거)
      const urlWithoutParams = existingUrl.split('?')[0];
      const fileName = urlWithoutParams.split('/').pop();
      await deleteFile(folder, fileName);

      // 폼 데이터에서 URL 제거 (함수형 업데이트)
      setFormData(prev => ({ ...prev, [field]: '' }));
      setToast({ type: 'success', text: '파일이 삭제되었습니다' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '파일 삭제 실패' });
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
      category: 'AMBIENT',
      bannerImageUrl: '',
      videoUrl: '',
    });
    setSelectedMusic(null);
    setShowDetailModal(false);
    setAction(null);
    setMessage({ type: '', text: '' });
  };

  const handleActionSelect = (actionType) => {
    setAction(actionType);
    setShowDetailModal(false);
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
      setToast({ type: 'success', text: '음악이 성공적으로 생성되었습니다!' });
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
      setToast({ type: 'success', text: '음악이 성공적으로 수정되었습니다!' });
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
      setToast({ type: 'success', text: '음악이 성공적으로 삭제되었습니다!' });
      resetForm();
      setMusicList(musicList.filter(m => m.id !== parseInt(formData.id)));
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '음악 삭제 실패' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="music-management">
      {toast && (
        <Toast
          message={toast.text}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* 이미지 뷰어 모달 */}
      <Modal
        isOpen={imageViewerUrl !== null}
        onClose={() => setImageViewerUrl(null)}
        title="이미지 보기"
        zIndex={20000}
      >
        <div className="image-viewer">
          <img src={imageViewerUrl} alt="전체 이미지" className="full-image" />
        </div>
      </Modal>

      <h1 className="page-title">음악 관리</h1>

      {/* 새로 만들기 버튼 */}
      <div className="action-bar">
        <button
          className="create-btn"
          onClick={() => {
            setFormData({
              id: '',
              title: '',
              filePath: '',
              duration: '',
              category: 'AMBIENT',
              bannerImageUrl: '',
              videoUrl: '',
            });
            setSelectedMusic(null);
            setShowDetailModal(false);
            setMessage({ type: '', text: '' });
            setAction('create');
          }}
        >
          + 새로 만들기
        </button>
      </div>

      {/* 검색 영역 */}
      <div className="search-section">
        <h2>음악 찾기</h2>
        <div className="search-controls">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="search-type-select"
          >
            <option value="all">전체 조회</option>
            <option value="title">제목으로 검색</option>
            <option value="category">카테고리로 검색</option>
            <option value="id">ID로 검색</option>
          </select>

          {searchType === 'category' ? (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          ) : searchType !== 'all' ? (
            <input
              type={searchType === 'id' ? 'number' : 'text'}
              placeholder={searchType === 'id' ? 'ID 입력...' : '검색어 입력...'}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          ) : null}

          <button onClick={handleSearch} className="search-btn" disabled={loading}>
            {loading ? '검색 중...' : searchType === 'all' ? '전체 조회' : '검색'}
          </button>
        </div>

        {/* 검색 결과 목록 */}
        {musicList.length > 0 && (
          <div className="results-list">
            <h3>검색 결과 ({musicList.length}개)</h3>
            <div className="items-list">
              {musicList.map((music) => (
                <div
                  key={music.id}
                  className={`list-item ${selectedMusic?.id === music.id ? 'selected' : ''}`}
                  onClick={() => handleMusicSelect(music)}
                >
                  <div className="item-id">ID: {music.id}</div>
                  <div className="item-title">{music.title}</div>
                  <div className="item-meta">
                    <span className="item-category">{music.category}</span>
                    <span className="item-duration">{music.duration}초</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 선택된 음악 상세 정보 모달 */}
      <Modal
        isOpen={showDetailModal && selectedMusic && !action}
        onClose={() => setShowDetailModal(false)}
        title="음악 상세 정보"
      >
        {selectedMusic && (
          <>
            <div className="modal-detail-content">
              <div className="modal-detail-field">
                <label>ID:</label>
                <span>{selectedMusic.id}</span>
              </div>
              <div className="modal-detail-field">
                <label>제목:</label>
                <span>{selectedMusic.title}</span>
              </div>
              <div className="modal-detail-field">
                <label>카테고리:</label>
                <span className="modal-category-badge">{selectedMusic.category}</span>
              </div>
              <div className="modal-detail-field">
                <label>재생 시간:</label>
                <span>{selectedMusic.duration}초</span>
              </div>
              {selectedMusic.filePath && (
                <div className="modal-detail-field">
                  <label>음악 파일:</label>
                  <audio
                    src={selectedMusic.filePath}
                    controls
                    className="modal-detail-audio"
                    style={{ width: '100%' }}
                  />
                </div>
              )}
              {selectedMusic.bannerImageUrl && (
                <div className="modal-detail-field">
                  <label>배너 이미지:</label>
                  <div>
                    <img
                      src={selectedMusic.bannerImageUrl}
                      alt="배너"
                      className="modal-detail-image clickable"
                      onClick={() => setImageViewerUrl(selectedMusic.bannerImageUrl)}
                      style={{ cursor: 'pointer', maxWidth: '200px', maxHeight: '200px', display: 'block', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      className="view-image-btn"
                      onClick={() => setImageViewerUrl(selectedMusic.bannerImageUrl)}
                      style={{ marginTop: '8px' }}
                    >
                      크게 보기
                    </button>
                  </div>
                </div>
              )}
              {selectedMusic.videoUrl && (
                <div className="modal-detail-field">
                  <label>비디오 파일:</label>
                  <video
                    src={selectedMusic.videoUrl}
                    controls
                    className="modal-detail-video"
                    style={{ maxWidth: '100%', maxHeight: '200px', display: 'block', borderRadius: '8px' }}
                  />
                </div>
              )}
            </div>

            <div className="modal-action-buttons">
              <button
                className="modal-update-btn"
                onClick={() => handleActionSelect('update')}
              >
                수정하기
              </button>
              <button
                className="modal-delete-btn"
                onClick={() => handleActionSelect('delete')}
              >
                삭제하기
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* 작업 폼 모달 (생성/수정/삭제) */}
      <Modal
        isOpen={action !== null}
        onClose={resetForm}
        title={
          action === 'create' ? '새 음악 만들기' :
          action === 'update' ? '음악 수정하기' :
          '음악 삭제하기'
        }
      >
        {action && (
          <form onSubmit={action === 'create' ? handleCreate : action === 'update' ? handleUpdate : handleDelete}>
            {action === 'delete' ? (
              <div className="delete-confirm">
                <p>정말 이 음악을 삭제하시겠습니까?</p>
                <div className="detail-field">
                  <label>ID:</label>
                  <span>{formData.id}</span>
                </div>
                <div className="detail-field">
                  <label>제목:</label>
                  <span>{formData.title}</span>
                </div>
              </div>
            ) : (
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
                      <audio
                        src={formData.filePath}
                        controls
                        className="preview-audio"
                        style={{ width: '100%', display: 'block', marginBottom: '8px' }}
                      />
                      <div className="file-preview-actions">
                        <span>✓ 업로드됨</span>
                        <button
                          type="button"
                          className="file-delete-btn"
                          onClick={() => handleFileDelete('filePath')}
                          disabled={loading || uploadingFile}
                        >
                          삭제
                        </button>
                      </div>
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
                      <img
                        src={formData.bannerImageUrl}
                        alt="배너 미리보기"
                        className="preview-image clickable"
                        onClick={() => setImageViewerUrl(formData.bannerImageUrl)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div className="file-preview-actions">
                        <span>✓ 업로드됨</span>
                        <button
                          type="button"
                          className="file-delete-btn"
                          onClick={() => handleFileDelete('bannerImageUrl')}
                          disabled={loading || uploadingBanner}
                        >
                          삭제
                        </button>
                      </div>
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
                      <video
                        src={formData.videoUrl}
                        controls
                        className="preview-video"
                        style={{ maxWidth: '100%', maxHeight: '300px', display: 'block', marginBottom: '8px' }}
                      />
                      <div className="file-preview-actions">
                        <span>✓ 업로드됨</span>
                        <button
                          type="button"
                          className="file-delete-btn"
                          onClick={() => handleFileDelete('videoUrl')}
                          disabled={loading || uploadingVideo}
                        >
                          삭제
                        </button>
                      </div>
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

            <div className="form-actions">
              <button
                type="submit"
                className="submit-btn"
                disabled={loading || uploadingFile || uploadingBanner || uploadingVideo}
              >
                {loading ? '처리 중...' :
                 action === 'create' ? '음악 생성' :
                 action === 'update' ? '수정 완료' :
                 '삭제 확인'}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={resetForm}
                disabled={loading}
              >
                취소
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MusicManagement;
