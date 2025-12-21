import api from './api';

/**
 * 파일을 업로드하고 URL을 반환합니다
 * @param {File} file - 업로드할 파일
 * @param {string} folder - 파일 저장 폴더 (PROFILE_IMAGE_FOLDER, MUSIC_FOLDER, MUSIC_BANNER_IMAGE_FOLDER, MUSIC_VIDEO)
 * @returns {Promise<{fileUrl: string}>}
 */
export const uploadFile = async (file, folder) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await api.post('/files/upload', formData);

  // 백엔드는 snake_case로 응답하므로 file_url을 fileUrl로 변환
  return {
    fileUrl: response.data.file_url
  };
};

/**
 * 파일을 삭제합니다
 * @param {string} folder - 파일이 저장된 폴더
 * @param {string} fileName - 삭제할 파일명
 */
export const deleteFile = async (folder, fileName) => {
  const response = await api.delete('/files', {
    params: { folder, fileName },
  });
  return response.data;
};

// 파일 폴더 상수
export const FILE_FOLDERS = {
  PROFILE_IMAGE: 'PROFILE_IMAGE_FOLDER',
  MUSIC: 'MUSIC_FOLDER',
  ANNOUNCEMENT_BANNER: 'ANNOUNCEMENT_BANNER_IMAGE_FOLDER',
  MUSIC_BANNER: 'MUSIC_BANNER_IMAGE_FOLDER',
  MUSIC_VIDEO: 'MUSIC_VIDEO_FOLDER',
};
