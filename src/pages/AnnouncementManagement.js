import React, { useState } from 'react';
import { getAllAnnouncements, getAnnouncementDetail, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/adminService';
import { uploadFile, deleteFile, FILE_FOLDERS } from '../services/fileService';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/AnnouncementManagement.css';

const AnnouncementManagement = () => {
  const [action, setAction] = useState(null); // 'create', 'update', 'delete', null
  const [searchType, setSearchType] = useState('all'); // 'all', 'title', 'id'
  const [searchKeyword, setSearchKeyword] = useState('');

  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState(null);
  const [imageViewerUrl, setImageViewerUrl] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // 생성 모드에서 업로드된 파일 URL 추적 (취소 시 삭제용)
  const [uploadedBannerUrl, setUploadedBannerUrl] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    content: '',
    bannerImageUrl: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      if (searchType === 'id' && searchKeyword) {
        // ID로 직접 조회
        const detail = await getAnnouncementDetail(parseInt(searchKeyword));
        const announcement = { id: parseInt(searchKeyword), ...detail };
        setSelectedAnnouncement(announcement);
        setAnnouncements([announcement]);
        return;
      }

      // 전체 목록 조회
      const response = await getAllAnnouncements(0, 100);
      let results = response?.content || [];

      // 클라이언트 사이드 필터링
      if (searchType === 'title' && searchKeyword) {
        results = results.filter(item =>
          item.title.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }

      setAnnouncements(results);
    } catch (error) {
      setMessage({ type: 'error', text: '공지사항 검색 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementSelect = async (announcement) => {
    setLoading(true);
    try {
      // 상세 정보 조회 API 호출
      const detail = await getAnnouncementDetail(announcement.id);
      const announcementDetail = { id: announcement.id, ...detail };

      setSelectedAnnouncement(announcementDetail);
      setFormData({
        id: announcementDetail.id,
        title: announcementDetail.title,
        content: announcementDetail.content,
        bannerImageUrl: announcementDetail.bannerImageUrl || '',
      });
      setShowDetailModal(true);
    } catch (error) {
      setMessage({ type: 'error', text: '공지사항 상세 정보 조회 실패' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 검증 (5MB = 5 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: 'error', text: '5MB 이상 파일은 업로드할 수 없습니다.' });
      e.target.value = ''; // 파일 input 초기화
      return;
    }

    setUploadingBanner(true);
    setMessage({ type: '', text: '' });

    try {
      // 기존 배너 이미지가 있으면 먼저 삭제
      const existingUrl = formData.bannerImageUrl;

      if (existingUrl) {
        try {
          // URL에서 파일명 추출 (쿼리 파라미터 제거)
          const urlWithoutParams = existingUrl.split('?')[0];
          const fileName = urlWithoutParams.split('/').pop();
          await deleteFile(FILE_FOLDERS.ANNOUNCEMENT_BANNER, fileName);
        } catch (deleteError) {
          // 삭제 실패해도 새 파일 업로드는 계속 진행
        }
      }

      const response = await uploadFile(file, FILE_FOLDERS.ANNOUNCEMENT_BANNER);

      // formData 상태를 함수형 업데이트로 변경
      setFormData(prev => ({ ...prev, bannerImageUrl: response.fileUrl }));

      // create 모드일 때만 업로드된 파일 추적 (취소 시 삭제용)
      if (action === 'create') {
        setUploadedBannerUrl(response.fileUrl);
      }

      setToast({ type: 'success', text: `배너 이미지 업로드 성공: ${file.name}` });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || '배너 이미지 업로드 실패' });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerDelete = async () => {
    if (!formData.bannerImageUrl) return;

    const confirmDelete = async () => {
      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      setUploadingBanner(true);
      setMessage({ type: '', text: '' });

      try {
        // URL에서 파일명 추출 (쿼리 파라미터 제거)
        const urlWithoutParams = formData.bannerImageUrl.split('?')[0];
        const fileName = urlWithoutParams.split('/').pop();
        await deleteFile(FILE_FOLDERS.ANNOUNCEMENT_BANNER, fileName);

        // 폼 데이터에서 URL 제거 (함수형 업데이트)
        setFormData(prev => ({ ...prev, bannerImageUrl: '' }));
        setToast({ type: 'success', text: '배너 이미지가 삭제되었습니다' });
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || '배너 삭제 실패' });
      } finally {
        setUploadingBanner(false);
      }
    };

    setConfirmModal({
      isOpen: true,
      title: '삭제 확인',
      message: '이 배너 이미지를 삭제하시겠습니까?',
      onConfirm: confirmDelete,
    });
  };

  const resetForm = async () => {
    // create 모드에서 업로드한 배너를 서버에서 삭제
    if (action === 'create' && uploadedBannerUrl) {
      try {
        const urlWithoutParams = uploadedBannerUrl.split('?')[0];
        const fileName = urlWithoutParams.split('/').pop();
        await deleteFile(FILE_FOLDERS.ANNOUNCEMENT_BANNER, fileName);
      } catch (error) {
        console.error('배너 삭제 실패:', error);
      }
    }

    setFormData({
      id: '',
      title: '',
      content: '',
      bannerImageUrl: '',
    });
    setUploadedBannerUrl(null);
    setSelectedAnnouncement(null);
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
      await createAnnouncement(createData);
      setToast({ type: 'success', text: '공지사항이 성공적으로 생성되었습니다!' });

      // 성공 시에는 uploadedBannerUrl 초기화만 (파일 삭제 안 함)
      setUploadedBannerUrl(null);
      setFormData({
        id: '',
        title: '',
        content: '',
        bannerImageUrl: '',
      });
      setSelectedAnnouncement(null);
      setShowDetailModal(false);
      setAction(null);
      setMessage({ type: '', text: '' });
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

    const confirmDelete = async () => {
      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      setLoading(true);
      setMessage({ type: '', text: '' });

      try {
        await deleteAnnouncement(parseInt(formData.id));
        setToast({ type: 'success', text: '공지사항이 성공적으로 삭제되었습니다!' });
        resetForm();
        setAnnouncements(announcements.filter(a => a.id !== parseInt(formData.id)));
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || '공지사항 삭제 실패' });
      } finally {
        setLoading(false);
      }
    };

    setConfirmModal({
      isOpen: true,
      title: '삭제 확인',
      message: '정말 이 공지사항을 삭제하시겠습니까?',
      onConfirm: confirmDelete,
    });
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })}
        danger={true}
      />

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

      <h1 className="page-title">공지사항 관리</h1>

      {/* 새로 만들기 버튼 */}
      <div className="action-bar">
        <button
          className="create-btn"
          onClick={() => {
            setFormData({
              id: '',
              title: '',
              content: '',
              bannerImageUrl: '',
            });
            setSelectedAnnouncement(null);
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
        <h2>공지사항 찾기</h2>
        <div className="search-controls">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="search-type-select"
          >
            <option value="all">전체 조회</option>
            <option value="title">제목으로 검색</option>
            <option value="id">ID로 검색</option>
          </select>

          {searchType !== 'all' && (
            <input
              type={searchType === 'id' ? 'number' : 'text'}
              placeholder={searchType === 'id' ? 'ID 입력...' : '제목 입력...'}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          )}

          <button onClick={handleSearch} className="search-btn" disabled={loading}>
            {loading ? '검색 중...' : searchType === 'all' ? '전체 조회' : '검색'}
          </button>
        </div>

        {/* 검색 결과 목록 */}
        {announcements.length > 0 && (
          <div className="results-list">
            <h3>검색 결과 ({announcements.length}개)</h3>
            <div className="items-list">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`list-item ${selectedAnnouncement?.id === announcement.id ? 'selected' : ''}`}
                  onClick={() => handleAnnouncementSelect(announcement)}
                >
                  <div className="item-id">ID: {announcement.id}</div>
                  <div className="item-title">{announcement.title}</div>
                  <div className="item-content-preview">
                    {announcement.content.substring(0, 100)}
                    {announcement.content.length > 100 ? '...' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 선택된 공지사항 상세 정보 모달 */}
      <Modal
        isOpen={showDetailModal && selectedAnnouncement && !action}
        onClose={() => setShowDetailModal(false)}
        title="공지사항 상세 정보"
      >
        {selectedAnnouncement && (
          <>
            <div className="modal-detail-content">
              <div className="modal-detail-field">
                <label>ID:</label>
                <span>{selectedAnnouncement.id}</span>
              </div>
              <div className="modal-detail-field">
                <label>제목:</label>
                <span>{selectedAnnouncement.title}</span>
              </div>
              <div className="modal-detail-field">
                <label>내용:</label>
                <p className="modal-detail-content-text">{selectedAnnouncement.content}</p>
              </div>
              {selectedAnnouncement.bannerImageUrl && (
                <div className="modal-detail-field">
                  <label>배너 이미지:</label>
                  <div>
                    <img
                      src={selectedAnnouncement.bannerImageUrl}
                      alt="배너"
                      className="modal-detail-image clickable"
                      onClick={() => setImageViewerUrl(selectedAnnouncement.bannerImageUrl)}
                      style={{ cursor: 'pointer', maxWidth: '200px', maxHeight: '200px', display: 'block', borderRadius: '8px' }}
                    />
                    <button
                      type="button"
                      className="view-image-btn"
                      onClick={() => setImageViewerUrl(selectedAnnouncement.bannerImageUrl)}
                      style={{ marginTop: '8px' }}
                    >
                      크게 보기
                    </button>
                  </div>
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
          action === 'create' ? '새 공지사항 만들기' :
          action === 'update' ? '공지사항 수정하기' :
          '공지사항 삭제하기'
        }
      >
        {action && (
          <form onSubmit={action === 'create' ? handleCreate : action === 'update' ? handleUpdate : handleDelete}>
            {action === 'delete' ? (
              <div className="delete-confirm">
                <p>정말 이 공지사항을 삭제하시겠습니까?</p>
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
                          onClick={handleBannerDelete}
                          disabled={loading || uploadingBanner}
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
                disabled={loading || uploadingBanner}
              >
                {loading ? '처리 중...' :
                 action === 'create' ? '공지사항 생성' :
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

export default AnnouncementManagement;
