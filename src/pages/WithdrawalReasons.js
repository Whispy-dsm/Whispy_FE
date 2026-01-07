import React, { useState, useEffect } from 'react';
import { getWithdrawalReasons, getWithdrawalReasonDetail, deleteWithdrawalReason } from '../services/adminService';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/WithdrawalReasons.css';

const WithdrawalReasons = () => {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 50,
    hasMore: true,
    totalElements: 0,
  });

  useEffect(() => {
    loadReasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReasons = async () => {
    setLoading(true);
    try {
      const response = await getWithdrawalReasons(0, pagination.size);
      const content = response.content || [];
      setReasons(content);
      setPagination({
        page: 0,
        size: 50,
        hasMore: content.length >= 50,
        totalElements: response.totalElements || 0,
      });
    } catch (error) {
      setMessage({ type: 'error', text: '탈퇴 사유 목록 불러오기 실패' });
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !pagination.hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = pagination.page + 1;
      const response = await getWithdrawalReasons(nextPage, pagination.size);
      const newContent = response.content || [];

      setReasons(prev => [...prev, ...newContent]);
      setPagination({
        ...pagination,
        page: nextPage,
        hasMore: newContent.length >= 50,
        totalElements: response.totalElements || 0,
      });
    } catch (error) {
      setMessage({ type: 'error', text: '추가 데이터 로드 실패' });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      loadMore();
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const detail = await getWithdrawalReasonDetail(id);
      setSelectedReason(detail);
    } catch (error) {
      setMessage({ type: 'error', text: '탈퇴 사유 상세 정보 불러오기 실패' });
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = async () => {
      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

      try {
        await deleteWithdrawalReason(id);
        setToast({ type: 'success', text: '탈퇴 사유가 성공적으로 삭제되었습니다!' });
        setSelectedReason(null);
        loadReasons();
      } catch (error) {
        setMessage({ type: 'error', text: '탈퇴 사유 삭제 실패' });
      }
    };

    setConfirmModal({
      isOpen: true,
      title: '삭제 확인',
      message: '정말 이 탈퇴 사유를 삭제하시겠습니까?',
      onConfirm: confirmDelete,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="withdrawal-reasons">
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

      <h1 className="page-title">탈퇴 사유</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="content-grid">
        <div className="reasons-list">
          <h2>전체 {pagination.totalElements}개</h2>

          {loading ? (
            <div className="loading">불러오는 중...</div>
          ) : (
            <>
              <div className="list-container" onScroll={handleScroll}>
                {reasons.length === 0 ? (
                  <div className="empty-state">탈퇴 사유가 없습니다</div>
                ) : (
                  <>
                    {reasons.map((reason) => (
                      <div
                        key={reason.id}
                        className={`reason-item ${selectedReason?.id === reason.id ? 'active' : ''}`}
                        onClick={() => handleViewDetail(reason.id)}
                      >
                        <div className="reason-type">{reason.reasonType}</div>
                        <div className="reason-date">{formatDate(reason.createdAt)}</div>
                      </div>
                    ))}
                    {loadingMore && (
                      <div className="loading-indicator">
                        <div className="spinner"></div>
                        <span>로딩 중</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="reason-detail">
          <h2>상세 정보</h2>

          {selectedReason ? (
            <div className="detail-content">
              <div className="detail-field">
                <label>ID:</label>
                <span>{selectedReason.id}</span>
              </div>

              <div className="detail-field">
                <label>사유 유형:</label>
                <span className="reason-badge">{selectedReason.reasonType}</span>
              </div>

              <div className="detail-field">
                <label>생성 일시:</label>
                <span>{formatDate(selectedReason.createdAt)}</span>
              </div>

              {selectedReason.detailContent && (
                <div className="detail-field">
                  <label>상세 내용:</label>
                  <p className="detail-text">{selectedReason.detailContent}</p>
                </div>
              )}

              <button
                className="delete-btn"
                onClick={() => handleDelete(selectedReason.id)}
              >
                사유 삭제
              </button>
            </div>
          ) : (
            <div className="empty-detail">
              사유를 선택하여 상세 정보를 확인하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawalReasons;
