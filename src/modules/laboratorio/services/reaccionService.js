import api from '../../../api/axios';

const REACCION_URL = '/laboratorio/reacciones/';

export const getReacciones = async (params = {}) => {
  const response = await api.get(REACCION_URL, { params });
  return response.data;
};

export const getReaccion = async (id) => {
  const response = await api.get(`${REACCION_URL}${id}/`);
  return response.data;
};

export const createReaccion = async (data) => {
  const response = await api.post(REACCION_URL, data);
  return response.data;
};

export const updateReaccion = async (id, data) => {
  const response = await api.put(`${REACCION_URL}${id}/`, data);
  return response.data;
};

export const deleteReaccion = async (id) => {
  const response = await api.delete(`${REACCION_URL}${id}/`);
  return response.data;
};
