import api from './api';
import heic2any from 'heic2any';

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return '';
};

const getFileBaseUrl = () => {
  return process.env.REACT_APP_FILE_BASE_URL || getApiBaseUrl();
};

const isPublicFilePath = (pathname) => {
  return pathname === '/file' || pathname.startsWith('/file/');
};

/**
 * HEIC 파일을 JPG로 변환합니다
 * @param {File} file - 변환할 HEIC 파일
 * @returns {Promise<File>} - 변환된 JPG 파일
 */
const convertHeicToJpg = async (file) => {
  try {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });

    // Blob을 File 객체로 변환
    const convertedFile = new File(
      [convertedBlob],
      file.name.replace(/\.heic$/i, '.jpg'),
      { type: 'image/jpeg' }
    );

    return convertedFile;
  } catch (error) {
    throw error;
  }
};

export const normalizeFileUrl = (fileUrl) => {
  if (!fileUrl) {
    return '';
  }

  if (/^https?:\/\//i.test(fileUrl)) {
    const parsedUrl = new URL(fileUrl);
    if (isPublicFilePath(parsedUrl.pathname)) {
      return new URL(parsedUrl.pathname + parsedUrl.search + parsedUrl.hash, getFileBaseUrl()).toString();
    }
    return fileUrl;
  }

  const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
  const baseUrl = isPublicFilePath(normalizedPath) ? getFileBaseUrl() : getApiBaseUrl();
  if (!baseUrl) {
    return fileUrl;
  }

  return new URL(normalizedPath, baseUrl).toString();
};

export const getFileDeleteParams = (fileUrl, fallbackFolder) => {
  const normalizedUrl = normalizeFileUrl(fileUrl);
  const parsedUrl = new URL(normalizedUrl, 'https://whispy.local');
  const pathSegments = parsedUrl.pathname
    .split('/')
    .filter(Boolean)
    .map(segment => decodeURIComponent(segment));

  const fileName = pathSegments.at(-1);
  if (!fileName) {
    throw new Error('삭제할 파일명을 추출할 수 없습니다.');
  }

  if (pathSegments[0] === 'file' && pathSegments.length >= 3) {
    return {
      folder: pathSegments[1].toUpperCase(),
      fileName: pathSegments.slice(2).join('/'),
    };
  }

  if (!fallbackFolder) {
    throw new Error('삭제할 파일 폴더를 확인할 수 없습니다.');
  }

  return {
    folder: fallbackFolder,
    fileName,
  };
};

/**
 * 파일을 업로드하고 URL을 반환합니다
 * @param {File} file - 업로드할 파일
 * @param {string} folder - 파일 저장 폴더 (PROFILE_IMAGE_FOLDER, MUSIC_FOLDER, MUSIC_BANNER_IMAGE_FOLDER, MUSIC_VIDEO)
 * @returns {Promise<{fileUrl: string}>}
 */
export const uploadFile = async (file, folder) => {
  let fileToUpload = file;

  // HEIC 파일인 경우 JPG로 변환
  if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
    fileToUpload = await convertHeicToJpg(file);
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
  formData.append('folder', folder);

  const response = await api.post('/files/upload', formData);

  // 백엔드는 snake_case로 응답하므로 file_url을 fileUrl로 변환
  return {
    fileUrl: normalizeFileUrl(response.data.file_url)
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

export const deleteFileByUrl = async (fileUrl, fallbackFolder) => {
  const { folder, fileName } = getFileDeleteParams(fileUrl, fallbackFolder);
  return deleteFile(folder, fileName);
};

// 파일 폴더 상수
export const FILE_FOLDERS = {
  PROFILE_IMAGE: 'PROFILE_IMAGE_FOLDER',
  MUSIC: 'MUSIC_FOLDER',
  ANNOUNCEMENT_BANNER: 'ANNOUNCEMENT_BANNER_IMAGE_FOLDER',
  MUSIC_BANNER: 'MUSIC_BANNER_IMAGE_FOLDER',
  MUSIC_VIDEO: 'MUSIC_VIDEO_FOLDER',
};
