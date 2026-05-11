import api from '../../../api/axios';

const CITACION_URL = '/admision/citaciones-donante/';

export const getCitaciones = async (params = {}) => {
  const response = await api.get(CITACION_URL, { params });
  return response.data;
};

export const getCitacion = async (id) => {
  const response = await api.get(`${CITACION_URL}${id}/`);
  return response.data;
};

export const createCitacion = async (data) => {
  const response = await api.post(CITACION_URL, data);
  return response.data;
};

export const updateCitacion = async (id, data) => {
  const response = await api.put(`${CITACION_URL}${id}/`, data);
  return response.data;
};

export const deleteCitacion = async (id) => {
  const response = await api.delete(`${CITACION_URL}${id}/`);
  return response.data;
};
