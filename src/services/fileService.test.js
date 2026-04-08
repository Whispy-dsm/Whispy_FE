process.env.REACT_APP_API_BASE_URL = 'https://whispy.whispy-company.site';

jest.mock('./api', () => ({
  __esModule: true,
  default: {
    delete: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('heic2any', () => jest.fn());

import api from './api';
import { deleteFileByUrl, getFileDeleteParams, normalizeFileUrl } from './fileService';

describe('fileService URL helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('relative 공개 파일 경로를 API 기준 절대 URL로 바꾼다', () => {
    expect(normalizeFileUrl('/file/music_folder/test.mp3')).toBe(
      'https://whispy.whispy-company.site/file/music_folder/test.mp3'
    );
  });

  it('이미 절대 URL이면 그대로 유지한다', () => {
    expect(normalizeFileUrl('https://cdn.example.com/file.webp')).toBe(
      'https://cdn.example.com/file.webp'
    );
  });

  it('공개 파일 URL에서 folder와 fileName을 추출한다', () => {
    expect(
      getFileDeleteParams(
        'https://whispy.whispy-company.site/file/music_banner_image_folder/test-banner.webp?cache=1'
      )
    ).toEqual({
      folder: 'MUSIC_BANNER_IMAGE_FOLDER',
      fileName: 'test-banner.webp',
    });
  });

  it('legacy 경로는 fallback folder로 삭제 파라미터를 만든다', () => {
    expect(getFileDeleteParams('/legacy/test.mp3', 'MUSIC_FOLDER')).toEqual({
      folder: 'MUSIC_FOLDER',
      fileName: 'test.mp3',
    });
  });

  it('deleteFileByUrl이 추출한 파라미터로 삭제 API를 호출한다', async () => {
    api.delete.mockResolvedValue({ data: undefined });

    await deleteFileByUrl(
      'https://whispy.whispy-company.site/file/music_video_folder/test-video.mp4'
    );

    expect(api.delete).toHaveBeenCalledWith('/files', {
      params: {
        folder: 'MUSIC_VIDEO_FOLDER',
        fileName: 'test-video.mp4',
      },
    });
  });
});
