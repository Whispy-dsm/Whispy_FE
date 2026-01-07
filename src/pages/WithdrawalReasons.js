import React, { useState, useEffect } from 'react';
import { getWithdrawalReasons, getWithdrawalReasonsByDate, getWithdrawalStatistics, getWithdrawalReasonDetail, deleteWithdrawalReason } from '../services/adminService';
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

  // 탭 상태 (list: 목록, statistics: 통계)
  const [activeTab, setActiveTab] = useState('list');

  // 날짜 필터 상태
  const [filterType, setFilterType] = useState('all'); // 'all' 또는 'date'
  const [filterDateRange, setFilterDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // 통계 상태
  const [statistics, setStatistics] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsDateRange, setStatsDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);

  useEffect(() => {
    loadReasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 기본 기간 설정 (최근 30일)
  useEffect(() => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
    setStatsDateRange({ startDate, endDate });
  }, []);

  const loadReasons = async () => {
    setLoading(true);
    try {
      let response;
      if (filterType === 'date' && filterDateRange.startDate && filterDateRange.endDate) {
        response = await getWithdrawalReasonsByDate(filterDateRange.startDate, filterDateRange.endDate, 0, pagination.size);
      } else {
        response = await getWithdrawalReasons(0, pagination.size);
      }
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
      let response;
      if (filterType === 'date' && filterDateRange.startDate && filterDateRange.endDate) {
        response = await getWithdrawalReasonsByDate(filterDateRange.startDate, filterDateRange.endDate, nextPage, pagination.size);
      } else {
        response = await getWithdrawalReasons(nextPage, pagination.size);
      }
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

  const loadStatistics = async () => {
    if (!statsDateRange.startDate || !statsDateRange.endDate) {
      setMessage({ type: 'error', text: '시작일과 종료일을 모두 선택해주세요' });
      return;
    }
    setStatsLoading(true);
    try {
      const data = await getWithdrawalStatistics(statsDateRange.startDate, statsDateRange.endDate);
      setStatistics(data || []);

      // 월별 데이터 집계
      const monthlyMap = {};
      data.forEach(stat => {
        const month = stat.date.substring(0, 7); // "2024-01-15" -> "2024-01"
        if (!monthlyMap[month]) {
          monthlyMap[month] = { month, count: 0, dailyData: [] };
        }
        monthlyMap[month].count += stat.count;
        monthlyMap[month].dailyData.push(stat);
      });

      const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
      setMonthlyStats(monthlyData);
      setSelectedMonth(null);
      setDailyStats([]);
    } catch (error) {
      setMessage({ type: 'error', text: '통계 불러오기 실패' });
    } finally {
      setStatsLoading(false);
    }
  };

  const handleMonthClick = (monthData) => {
    if (selectedMonth === monthData.month) {
      setSelectedMonth(null);
      setDailyStats([]);
    } else {
      setSelectedMonth(monthData.month);
      setDailyStats(monthData.dailyData);
    }
  };

  const handleFilterTypeChange = (type) => {
    setFilterType(type);
    if (type === 'all') {
      setFilterDateRange({ startDate: '', endDate: '' });
    }
  };

  const handleDateSearch = () => {
    if (filterType === 'date' && (!filterDateRange.startDate || !filterDateRange.endDate)) {
      setMessage({ type: 'error', text: '시작일과 종료일을 모두 선택해주세요' });
      return;
    }
    loadReasons();
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

  // 통계 최대값 계산 (바 차트 비율 계산용)
  const maxMonthlyCount = monthlyStats.length > 0 ? Math.max(...monthlyStats.map(s => s.count)) : 1;
  const maxDailyCount = dailyStats.length > 0 ? Math.max(...dailyStats.map(s => s.count)) : 1;

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

      {/* 탭 네비게이션 */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          목록
        </button>
        <button
          className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          통계
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* 날짜 필터 */}
          <div className="filter-section">
            <div className="filter-type-btns">
              <button
                className={`filter-type-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => handleFilterTypeChange('all')}
              >
                전체
              </button>
              <button
                className={`filter-type-btn ${filterType === 'date' ? 'active' : ''}`}
                onClick={() => handleFilterTypeChange('date')}
              >
                날짜별
              </button>
            </div>
            {filterType === 'date' && (
              <div className="date-filter">
                <input
                  type="date"
                  value={filterDateRange.startDate}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, startDate: e.target.value })}
                  className="date-input"
                  placeholder="시작일"
                />
                <span>~</span>
                <input
                  type="date"
                  value={filterDateRange.endDate}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, endDate: e.target.value })}
                  className="date-input"
                  placeholder="종료일"
                />
                <button className="search-btn" onClick={handleDateSearch}>
                  조회
                </button>
              </div>
            )}
          </div>

          <div className="content-grid">
            <div className="reasons-list">
              <h2>
                {filterType === 'date' && filterDateRange.startDate && filterDateRange.endDate
                  ? `${filterDateRange.startDate} ~ ${filterDateRange.endDate} (${pagination.totalElements}개)`
                  : `전체 ${pagination.totalElements}개`}
              </h2>

              {loading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                </div>
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
        </>
      ) : (
        /* 통계 탭 */
        <div className="statistics-section">
          <div className="stats-filter">
            <div className="stats-date-range">
              <label>시작일</label>
              <input
                type="date"
                value={statsDateRange.startDate}
                onChange={(e) => setStatsDateRange({ ...statsDateRange, startDate: e.target.value })}
                className="date-input"
              />
            </div>
            <div className="stats-date-range">
              <label>종료일</label>
              <input
                type="date"
                value={statsDateRange.endDate}
                onChange={(e) => setStatsDateRange({ ...statsDateRange, endDate: e.target.value })}
                className="date-input"
              />
            </div>
            <button className="search-btn" onClick={loadStatistics}>
              통계 조회
            </button>
          </div>

          {statsLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
            </div>
          ) : monthlyStats.length > 0 ? (
            <div className="stats-chart">
              <div className="stats-summary">
                <span>총 탈퇴 건수: <strong>{statistics.reduce((sum, s) => sum + s.count, 0)}건</strong></span>
              </div>

              {/* 월별 세로 바 그래프 */}
              <div className="vertical-chart-container">
                <div className="vertical-bars">
                  {monthlyStats.map((stat, index) => (
                    <div
                      key={index}
                      className={`vertical-bar-item ${selectedMonth === stat.month ? 'active' : ''}`}
                      onClick={() => handleMonthClick(stat)}
                    >
                      <div className="vertical-bar-count">{stat.count}건</div>
                      <div className="vertical-bar-wrapper">
                        <div
                          className="vertical-bar"
                          style={{ height: `${(stat.count / maxMonthlyCount) * 100}%` }}
                        ></div>
                      </div>
                      <div className="vertical-bar-label">{stat.month}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 일별 상세 그래프 */}
              {selectedMonth && dailyStats.length > 0 && (
                <div className="daily-chart">
                  <h3>{selectedMonth} 일별 상세</h3>
                  <div className="vertical-chart-container daily">
                    <div className="vertical-bars">
                      {dailyStats.map((stat, index) => (
                        <div key={index} className="vertical-bar-item small">
                          <div className="vertical-bar-count">{stat.count}</div>
                          <div className="vertical-bar-wrapper">
                            <div
                              className="vertical-bar"
                              style={{ height: `${(stat.count / maxDailyCount) * 100}%` }}
                            ></div>
                          </div>
                          <div className="vertical-bar-label">{stat.date.split('-')[2]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              날짜 범위를 선택하고 통계 조회 버튼을 클릭하세요
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WithdrawalReasons;
