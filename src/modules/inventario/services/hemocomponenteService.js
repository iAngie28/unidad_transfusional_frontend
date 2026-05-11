import api from '../../../api/axios';

const HEMOCOMPONENTE_URL = '/inventario/hemocomponentes/';

export const getHemocomponentes = async (params = {}) => {
  const response = await api.get(HEMOCOMPONENTE_URL, { params });
  return response.data;
};

export const getHemocomponente = async (id) => {
  const response = await api.get(`${HEMOCOMPONENTE_URL}${id}/`);
  return response.data;
};

export const createHemocomponente = async (data) => {
  const response = await api.post(HEMOCOMPONENTE_URL, data);
  return response.data;
};

export const updateHemocomponente = async (id, data) => {
  const response = await api.put(`${HEMOCOMPONENTE_URL}${id}/`, data);
  return response.data;
};

export const deleteHemocomponente = async (id) => {
  const response = await api.delete(`${HEMOCOMPONENTE_URL}${id}/`);
  return response.data;
};
