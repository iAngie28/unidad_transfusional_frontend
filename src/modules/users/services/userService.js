import api from '../../../api/axios';

const USER_URL = '/users/usuarios/';

export const getUsers = async (params = {}) => {
  const response = await api.get(USER_URL, { params });
  return response.data;
};

export const getUser = async (id) => {
  const response = await api.get(`${USER_URL}${id}/`);
  return response.data;
};

export const createUser = async (data) => {
  const response = await api.post(USER_URL, data);
  return response.data;
};

export const updateUser = async (id, data) => {
  // If password is empty, don't send it to avoid overwriting with empty string
  const payload = { ...data };
  if (!payload.password) {
    delete payload.password;
  }
  const response = await api.put(`${USER_URL}${id}/`, payload);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`${USER_URL}${id}/`);
  return response.data;
};
