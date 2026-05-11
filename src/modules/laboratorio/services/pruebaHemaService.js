import api from '../../../api/axios';

const PRUEBAS_HEMA_URL = '/laboratorio/pruebas-hema/';

export const getPruebasHema = async (params = {}) => {
  const response = await api.get(PRUEBAS_HEMA_URL, { params });
  return response.data;
};

export const getPruebaHema = async (id) => {
  const response = await api.get(`${PRUEBAS_HEMA_URL}${id}/`);
  return response.data;
};

export const createPruebaHema = async (data) => {
  const response = await api.post(PRUEBAS_HEMA_URL, data);
  return response.data;
};

export const updatePruebaHema = async (id, data) => {
  const response = await api.put(`${PRUEBAS_HEMA_URL}${id}/`, data);
  return response.data;
};

export const deletePruebaHema = async (id) => {
  const response = await api.delete(`${PRUEBAS_HEMA_URL}${id}/`);
  return response.data;
};
