process.env.REACT_APP_API_BASE_URL = 'https://whispy-stag.whispy-company.site';

jest.mock('./api', () => ({
  __esModule: true,
  default: {
    delete: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('heic2any', () => jest.fn());

import api from './api';
import {
  deleteFileByUrl,
  getFileDeleteParams,
  normalizeFileUrl,
  uploadFile,
} from './fileService';

describe('fileService URL helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes relative public file paths to the active API domain by default', () => {
    expect(normalizeFileUrl('/file/music_folder/test.mp3')).toBe(
      'https://whispy-stag.whispy-company.site/file/music_folder/test.mp3'
    );
  });

  it('rewrites public file URLs to the active API domain by default', () => {
    expect(
      normalizeFileUrl('https://whispy.whispy-company.site/file/music_folder/test.mp3')
    ).toBe('https://whispy-stag.whispy-company.site/file/music_folder/test.mp3');
  });

  it('keeps non-file absolute URLs unchanged', () => {
    expect(normalizeFileUrl('https://cdn.example.com/file.webp')).toBe(
      'https://cdn.example.com/file.webp'
    );
  });

  it('extracts delete params from a public file URL', () => {
    expect(
      getFileDeleteParams(
        'https://whispy.whispy-company.site/file/music_banner_image_folder/test-banner.webp?cache=1'
      )
    ).toEqual({
      folder: 'MUSIC_BANNER_IMAGE_FOLDER',
      fileName: 'test-banner.webp',
    });
  });

  it('uses the fallback folder for legacy paths', () => {
    expect(getFileDeleteParams('/legacy/test.mp3', 'MUSIC_FOLDER')).toEqual({
      folder: 'MUSIC_FOLDER',
      fileName: 'test.mp3',
    });
  });

  it('calls delete API with params extracted from the public file URL', async () => {
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

  it('normalizes upload response file_url to the active API domain by default', async () => {
    api.post.mockResolvedValue({
      data: {
        file_url: 'https://whispy.whispy-company.site/file/profile_image_folder/test.webp',
      },
    });

    const response = await uploadFile(
      new File(['image'], 'test.webp', { type: 'image/webp' }),
      'PROFILE_IMAGE_FOLDER'
    );

    expect(response).toEqual({
      fileUrl: 'https://whispy-stag.whispy-company.site/file/profile_image_folder/test.webp',
    });
  });
});
