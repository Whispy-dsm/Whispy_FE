import React, { useState } from 'react';
import { uploadFile, deleteFile, FILE_FOLDERS } from '../services/fileService';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/FileUploadManagement.css';

const FileUploadManagement = () => {
  const [selectedFolder, setSelectedFolder] = useState(() => {
    return localStorage.getItem('fileUploadFolder') || 'PROFILE_IMAGE';
  });
  const [uploadedFiles, setUploadedFiles] = useState(() => {
    const saved = localStorage.getItem('uploadedFiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [imageViewerUrl, setImageViewerUrl] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [message, setMessage] = useState({ type: '', text: '' });

  const folders = [
    { value: 'PROFILE_IMAGE', label: '프로필 이미지', accept: 'image/*', maxSize: 5 },
    { value: 'MUSIC', label: '음악 파일', accept: 'audio/*', maxSize: 50 },
    { value: 'ANNOUNCEMENT_BANNER', label: '공지사항 배너', accept: 'image/*', maxSize: 5 },
    { value: 'MUSIC_BANNER', label: '음악 배너', accept: 'image/*', maxSize: 5 },
    { value: 'MUSIC_VIDEO', label: '음악 비디오', accept: 'video/*', maxSize: 50 },
  ];

  const getCurrentFolder = () => folders.find(f => f.value === selectedFolder);

  // selectedFolder 변경 시 localStorage에 저장
  React.useEffect(() => {
    localStorage.setItem('fileUploadFolder', selectedFolder);
  }, [selectedFolder]);

  // uploadedFiles 변경 시 localStorage에 저장
  React.useEffect(() => {
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const currentFolder = getCurrentFolder();
    const maxSize = currentFolder.maxSize * 1024 * 1024;

    setMessage({ type: '', text: '' });

    for (const file of files) {
      if (file.size > maxSize) {
        setMessage({ type: 'error', text: `${file.name}: ${currentFolder.maxSize}MB 이상 파일은 업로드할 수 없습니다.` });
        continue;
      }

      setUploading(true);
      try {
        const response = await uploadFile(file, FILE_FOLDERS[selectedFolder]);

        setUploadedFiles(prev => [...prev, {
          id: Date.now() + Math.random(),
          name: file.name,
          url: response.fileUrl,
          folder: selectedFolder,
          type: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        }]);

        setToast({ type: 'success', text: `파일 업로드 성공: ${file.name}` });
      } catch (error) {
        setMessage({ type: 'error', text: `${file.name}: ${error.response?.data?.message || '업로드 실패'}` });
      } finally {
        setUploading(false);
      }
    }

    event.target.value = '';
  };

  const handleFileDelete = (file) => {
    const confirmDelete = async () => {
      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      setMessage({ type: '', text: '' });

      try {
        const urlWithoutParams = file.url.split('?')[0];
        const fileName = urlWithoutParams.split('/').pop();
        await deleteFile(FILE_FOLDERS[file.folder], fileName);

        setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
        setToast({ type: 'success', text: '파일이 삭제되었습니다' });
      } catch (error) {
        setMessage({ type: 'error', text: error.response?.data?.message || '파일 삭제 실패' });
      }
    };

    setConfirmModal({
      isOpen: true,
      title: '삭제 확인',
      message: `"${file.name}" 파일을 삭제하시겠습니까?`,
      onConfirm: confirmDelete,
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const renderFilePreview = (file) => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="file-preview-thumbnail"
          onClick={() => setImageViewerUrl(file.url)}
        />
      );
    } else if (file.type.startsWith('audio/')) {
      return (
        <audio src={file.url} controls className="file-preview-audio" />
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <video src={file.url} controls className="file-preview-video" />
      );
    }
    return <div className="file-preview-icon">📄</div>;
  };

  const handleClearAllFiles = () => {
    const confirmClear = () => {
      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
      setUploadedFiles([]);
      localStorage.removeItem('uploadedFiles');
      setToast({ type: 'success', text: '모든 파일 목록이 삭제되었습니다' });
    };

    setConfirmModal({
      isOpen: true,
      title: '전체 삭제 확인',
      message: '업로드된 모든 파일 목록을 삭제하시겠습니까? (서버의 파일은 삭제되지 않으며, 목록만 초기화됩니다)',
      onConfirm: confirmClear,
    });
  };

  const filteredFiles = uploadedFiles.filter(f => f.folder === selectedFolder);

  return (
    <div className="file-upload-management">
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

      <h1 className="page-title">파일 업로드 관리</h1>

      <div className="upload-section">
        <div className="folder-selector">
          <label htmlFor="folder">업로드 폴더 *</label>
          <select
            id="folder"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="folder-select"
          >
            {folders.map((folder) => (
              <option key={folder.value} value={folder.value}>
                {folder.label} (최대 {folder.maxSize}MB)
              </option>
            ))}
          </select>
        </div>

        <div className="upload-controls">
          <input
            type="file"
            id="fileInput"
            accept={getCurrentFolder()?.accept}
            onChange={handleFileUpload}
            disabled={uploading}
            multiple
            style={{ display: 'none' }}
          />
          <label htmlFor="fileInput" className={`upload-btn ${uploading ? 'disabled' : ''}`}>
            {uploading ? '업로드 중...' : '+ 파일 선택'}
          </label>
          <p className="upload-info">
            {getCurrentFolder()?.label} 업로드 ({getCurrentFolder()?.accept}, 최대 {getCurrentFolder()?.maxSize}MB)
          </p>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="files-section">
        <div className="files-header">
          <h2>
            업로드된 파일 ({filteredFiles.length}개)
            {filteredFiles.length > 0 && (
              <span className="total-size">
                {' '}
                - 총 {formatFileSize(filteredFiles.reduce((sum, f) => sum + f.size, 0))}
              </span>
            )}
          </h2>
          {uploadedFiles.length > 0 && (
            <button className="clear-all-btn" onClick={handleClearAllFiles}>
              전체 목록 삭제
            </button>
          )}
        </div>

        {filteredFiles.length === 0 ? (
          <div className="empty-state">
            <p>업로드된 파일이 없습니다</p>
            <p className="empty-state-hint">위의 "파일 선택" 버튼을 클릭하여 파일을 업로드하세요</p>
          </div>
        ) : (
          <div className="files-grid">
            {filteredFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-preview">
                  {renderFilePreview(file)}
                </div>
                <div className="file-info">
                  <div className="file-name" title={file.name}>{file.name}</div>
                  <div className="file-meta">
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    <span className="file-date">
                      {new Date(file.uploadedAt).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="file-url">
                    <input
                      type="text"
                      value={file.url}
                      readOnly
                      className="url-input"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      className="copy-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(file.url);
                        setToast({ type: 'success', text: 'URL이 복사되었습니다' });
                      }}
                    >
                      복사
                    </button>
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    className="delete-btn"
                    onClick={() => handleFileDelete(file)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadManagement;
