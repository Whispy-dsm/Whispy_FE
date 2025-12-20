import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!adminId || !password) {
      setError('관리자 ID와 비밀번호를 모두 입력해주세요');
      setLoading(false);
      return;
    }

    if (password.length < 8 || password.length > 70) {
      setError('비밀번호는 8자 이상 70자 이하여야 합니다');
      setLoading(false);
      return;
    }

    const result = await login(adminId, password);
    setLoading(false);

    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Whispy 관리자</h1>
        <p className="login-subtitle">관리자 계정으로 로그인하세요</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="adminId">관리자 ID</label>
            <input
              type="text"
              id="adminId"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="관리자 ID를 입력하세요"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
