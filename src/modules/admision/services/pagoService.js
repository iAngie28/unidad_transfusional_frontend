import api from '../../../api/axios';

const PAGO_URL = '/admision/pagos/';

export const getPagos = async (params = {}) => {
  const response = await api.get(PAGO_URL, { params });
  return response.data;
};

export const getPago = async (id) => {
  const response = await api.get(`${PAGO_URL}${id}/`);
  return response.data;
};

export const createPago = async (data) => {
  const response = await api.post(PAGO_URL, data);
  return response.data;
};

export const updatePago = async (id, data) => {
  const response = await api.put(`${PAGO_URL}${id}/`, data);
  return response.data;
};

export const deletePago = async (id) => {
  const response = await api.delete(`${PAGO_URL}${id}/`);
  return response.data;
};
