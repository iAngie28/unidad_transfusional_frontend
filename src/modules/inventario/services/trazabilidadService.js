import api from '../../../api/axios';

const TRAZABILIDAD_URL = '/inventario/trazabilidades/';

export const getTrazabilidades = async (params = {}) => {
  const response = await api.get(TRAZABILIDAD_URL, { params });
  return response.data;
};

export const getTrazabilidad = async (id) => {
  const response = await api.get(`${TRAZABILIDAD_URL}${id}/`);
  return response.data;
};

export const createTrazabilidad = async (data) => {
  const response = await api.post(TRAZABILIDAD_URL, data);
  return response.data;
};

export const updateTrazabilidad = async (id, data) => {
  const response = await api.put(`${TRAZABILIDAD_URL}${id}/`, data);
  return response.data;
};

export const deleteTrazabilidad = async (id) => {
  const response = await api.delete(`${TRAZABILIDAD_URL}${id}/`);
  return response.data;
};
