import api from '../../../api/axios';

const TRANSFUSION_URL = '/laboratorio/transfusiones/';

export const getTransfusiones = async (params = {}) => {
  const response = await api.get(TRANSFUSION_URL, { params });
  return response.data;
};

export const getTransfusion = async (id) => {
  const response = await api.get(`${TRANSFUSION_URL}${id}/`);
  return response.data;
};

export const createTransfusion = async (data) => {
  const response = await api.post(TRANSFUSION_URL, data);
  return response.data;
};

export const updateTransfusion = async (id, data) => {
  const response = await api.put(`${TRANSFUSION_URL}${id}/`, data);
  return response.data;
};

export const deleteTransfusion = async (id) => {
  const response = await api.delete(`${TRANSFUSION_URL}${id}/`);
  return response.data;
};
