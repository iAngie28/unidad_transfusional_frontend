import api from '../../../api/axios';

const DESCARTE_URL = '/inventario/descartes/';

export const getDescartes = async (params = {}) => {
  const response = await api.get(DESCARTE_URL, { params });
  return response.data;
};

export const getDescarte = async (id) => {
  const response = await api.get(`${DESCARTE_URL}${id}/`);
  return response.data;
};

export const createDescarte = async (data) => {
  const response = await api.post(DESCARTE_URL, data);
  return response.data;
};

export const updateDescarte = async (id, data) => {
  const response = await api.put(`${DESCARTE_URL}${id}/`, data);
  return response.data;
};

export const deleteDescarte = async (id) => {
  const response = await api.delete(`${DESCARTE_URL}${id}/`);
  return response.data;
};
