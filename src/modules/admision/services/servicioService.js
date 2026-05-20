import api from '../../../api/axios';

const SERVICIO_URL = '/admision/servicios/';

export const getServicios = async (params = {}) => {
  const response = await api.get(SERVICIO_URL, { params });
  return response.data;
};

export const getServicio = async (id) => {
  const response = await api.get(`${SERVICIO_URL}${id}/`);
  return response.data;
};

export const createServicio = async (data) => {
  const response = await api.post(SERVICIO_URL, data);
  return response.data;
};

export const updateServicio = async (id, data) => {
  const response = await api.put(`${SERVICIO_URL}${id}/`, data);
  return response.data;
};

export const deleteServicio = async (id) => {
  const response = await api.delete(`${SERVICIO_URL}${id}/`);
  return response.data;
};
