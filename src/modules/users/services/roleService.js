import api from '../../../api/axios';

const ROLE_URL = '/users/roles/';

export const getRoles = async (params = {}) => {
  const response = await api.get(ROLE_URL, { params });
  return response.data;
};

export const getRole = async (id) => {
  const response = await api.get(`${ROLE_URL}${id}/`);
  return response.data;
};

export const createRole = async (data) => {
  const response = await api.post(ROLE_URL, data);
  return response.data;
};

export const updateRole = async (id, data) => {
  const response = await api.put(`${ROLE_URL}${id}/`, data);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await api.delete(`${ROLE_URL}${id}/`);
  return response.data;
};
