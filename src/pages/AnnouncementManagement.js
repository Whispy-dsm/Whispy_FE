import React, { useState } from 'react';
import { getAllAnnouncements, getAnnouncementDetail, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/adminService';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import ReactMarkdown from 'react-markdown';
import '../styles/AnnouncementManagement.css';

const AnnouncementManagement = () => {
  const [action, setAction] = useState(null); // 'create', 'update', 'delete', null
  const [searchType, setSearchType] = useState('all'); // 'all', 'title', 'id'
  const [searchKeyword, setSearchKeyword] = useState('');

  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    page: 0,
    hasMore: true,
    totalElements: 0,
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState(null);
  const [imageViewerUrl, setImageViewerUrl] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    content: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    setPagination({ page: 0, hasMore: true, totalElements: 0 });
    try {
      if (searchType === 'id' && searchKeyword) {
        // ID로 직접 조회
        const detail = await getAnnouncementDetail(parseInt(searchKeyword));
        const announcement = { id: parseInt(searchKeyword), ...detail };
        setSelectedAnnouncement(announcement);
        setAnnouncements([announcement]);
        setPagination({ page: 0, hasMore: false, totalElements: 1 });
        return;
      }

      // 전체 목록 조회
      const response = await getAllAnnouncements(0, 50);
      let results = response?.content || [];

      // 클라이언트 사이드 필터링
      if (searchType === 'title' && searchKeyword) {
        results = results.filter(item =>
          item.title.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }

      setAnnouncements(results);
      setPagination({
        page: 0,
        hasMore: results.length >= 50 && searchType !== 'title',
        totalElements: response?.totalElements || 0,
      });
    } catch (error) {
      setMessage({ type: 'error', text: '공지사항 검색 실패' });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !pagination.hasMore || searchType === 'title') return;

    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await getAllAnnouncements(nextPage, 50);
      const newContent = response?.content || [];

      setAnnouncements(prev => [...prev, ...newContent]);
      setPagination({
        page: nextPage,
        hasMore: newContent.length >= 50,
        totalElements: response?.totalElements || 0,
      });
    } catch (error) {
      setMessage({ type: 'error', text: '추가 데이터 로드 실패' });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // 스크롤이 하단 100px 이내에 도달하면 더 로드
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
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

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      content: '',
    });
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
            <h3>전체 {pagination.totalElements}개</h3>
            <div className="items-list" onScroll={handleScroll}>
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`list-item ${selectedAnnouncement?.id === announcement.id ? 'selected' : ''}`}
                  onClick={() => handleAnnouncementSelect(announcement)}
                >
                  <div className="item-id">ID: {announcement.id}</div>
                  <div className="item-title">{announcement.title}</div>
                  <div className="item-content-preview markdown-content">
                    <ReactMarkdown>
                      {announcement.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {loadingMore && (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <span>로딩 중</span>
                </div>
              )}
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
                <div className="modal-detail-content-text markdown-content">
                  <ReactMarkdown>{selectedAnnouncement.content}</ReactMarkdown>
                </div>
              </div>
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
                  <label htmlFor="content">내용 (마크다운) *</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    maxLength="10000"
                    rows="15"
                    required
                    disabled={loading}
                    placeholder="마크다운 형식으로 작성하세요. 이미지는 ![alt](url) 형식으로 추가할 수 있습니다."
                  />
                  <p style={{ fontSize: '12px', color: '#737373', marginTop: '4px' }}>
                    💡 이미지 추가: 파일 업로드 페이지에서 이미지를 업로드한 후 URL을 복사하여 ![이미지](URL) 형식으로 추가하세요
                  </p>
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
                disabled={loading}
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
