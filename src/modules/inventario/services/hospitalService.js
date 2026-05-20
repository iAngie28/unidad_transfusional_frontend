import api from '../../../api/axios';

const HOSPITAL_URL = '/inventario/hospitales/';

export const getHospitales = async (params = {}) => {
  const response = await api.get(HOSPITAL_URL, { params });
  return response.data;
};

export const getHospital = async (id) => {
  const response = await api.get(`${HOSPITAL_URL}${id}/`);
  return response.data;
};

export const createHospital = async (data) => {
  const response = await api.post(HOSPITAL_URL, data);
  return response.data;
};

export const updateHospital = async (id, data) => {
  const response = await api.put(`${HOSPITAL_URL}${id}/`, data);
  return response.data;
};

export const deleteHospital = async (id) => {
  const response = await api.delete(`${HOSPITAL_URL}${id}/`);
  return response.data;
};
