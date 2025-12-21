import React, { useState, useEffect } from 'react';
import { getWithdrawalReasons, getWithdrawalReasonDetail, deleteWithdrawalReason } from '../services/adminService';
import '../styles/WithdrawalReasons.css';

const WithdrawalReasons = () => {
  const [reasons, setReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalPages: 0,
    totalElements: 0,
  });

  useEffect(() => {
    loadReasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.size]);

  const loadReasons = async () => {
    setLoading(true);
    try {
      const response = await getWithdrawalReasons(pagination.page, pagination.size);
      setReasons(response.content || []);
      setPagination({
        ...pagination,
        totalPages: response.totalPages || 0,
        totalElements: response.totalElements || 0,
      });
    } catch (error) {
      setMessage({ type: 'error', text: '탈퇴 사유 목록 불러오기 실패' });
    } finally {
      setLoading(false);
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
    if (!window.confirm('정말 이 탈퇴 사유를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteWithdrawalReason(id);
      setMessage({ type: 'success', text: '탈퇴 사유가 성공적으로 삭제되었습니다!' });
      setSelectedReason(null);
      loadReasons();
    } catch (error) {
      setMessage({ type: 'error', text: '탈퇴 사유 삭제 실패' });
    }
  };

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="withdrawal-reasons">
      <h1 className="page-title">탈퇴 사유</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="content-grid">
        <div className="reasons-list">
          <h2>사유 목록</h2>

          {loading ? (
            <div className="loading">불러오는 중...</div>
          ) : (
            <>
              <div className="list-container">
                {reasons.length === 0 ? (
                  <div className="empty-state">탈퇴 사유가 없습니다</div>
                ) : (
                  reasons.map((reason) => (
                    <div
                      key={reason.id}
                      className={`reason-item ${selectedReason?.id === reason.id ? 'active' : ''}`}
                      onClick={() => handleViewDetail(reason.id)}
                    >
                      <div className="reason-type">{reason.reasonType}</div>
                      <div className="reason-date">{formatDate(reason.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 0}
                  >
                    이전
                  </button>
                  <span>
                    {pagination.page + 1} / {pagination.totalPages} 페이지
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages - 1}
                  >
                    다음
                  </button>
                </div>
              )}
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
