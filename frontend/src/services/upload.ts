import api from './api';

export const uploadProfilePhotoApi = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/api/upload/profile-photo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // { fileUrl }
};

export const uploadAssignmentApi = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/api/upload/assignment', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // { fileUrl }
};

export const getSignedUrlApi = async (key: string) => {
  const response = await api.get('/api/upload/signed-url', { params: { key } });
  return response.data; // { signedUrl }
};
