import api from './api';

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj) => {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = toSnakeCase(obj[key]);
    return acc;
  }, {});
};

// Authentication
export const adminLogin = async (adminId, password) => {
  const response = await api.post('/admin/login', toSnakeCase({ adminId, password }));
  return response.data;
};

// Topics
export const addNewTopic = async (topic, defaultSubscribed) => {
  const response = await api.post('/admin/topics/add', toSnakeCase({ topic, defaultSubscribed }));
  return response.data;
};

// Music Management
export const createMusic = async (musicData) => {
  const response = await api.post('/admin/musics', toSnakeCase(musicData));
  return response.data;
};

export const updateMusic = async (musicData) => {
  const response = await api.patch('/admin/musics', toSnakeCase(musicData));
  return response.data;
};

export const deleteMusic = async (id) => {
  const response = await api.delete(`/admin/musics/${id}`);
  return response.data;
};

// Announcement Management
export const createAnnouncement = async (announcementData) => {
  const response = await api.post('/admin/announcements', toSnakeCase(announcementData));
  return response.data;
};

export const updateAnnouncement = async (announcementData) => {
  const response = await api.patch('/admin/announcements', toSnakeCase(announcementData));
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  const response = await api.delete(`/admin/announcements/${id}`);
  return response.data;
};

// Withdrawal Reasons
export const getWithdrawalReasons = async (page = 0, size = 10, sort = 'createdAt,desc') => {
  const response = await api.get('/admin/withdrawal-reasons', {
    params: { page, size, sort },
  });
  return response.data;
};

export const getWithdrawalReasonDetail = async (id) => {
  const response = await api.get(`/admin/withdrawal-reasons/${id}`);
  return response.data;
};

export const deleteWithdrawalReason = async (id) => {
  const response = await api.delete(`/admin/withdrawal-reasons/${id}`);
  return response.data;
};

// Notifications
export const sendNotification = async (notificationData) => {
  const response = await api.post('/admin/notifications/send', toSnakeCase(notificationData));
  return response.data;
};

export const sendTopicNotification = async (notificationData) => {
  const response = await api.post('/admin/notifications/topic/send', toSnakeCase(notificationData));
  return response.data;
};

export const broadcastNotification = async (notificationData) => {
  const response = await api.post('/admin/notifications/broadcast', toSnakeCase(notificationData));
  return response.data;
};
