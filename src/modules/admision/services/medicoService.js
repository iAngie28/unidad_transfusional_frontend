import api from '../../../api/axios';

const MEDICO_URL = '/admision/medicos/';

export const getMedicos = async (params = {}) => {
  const response = await api.get(MEDICO_URL, { params });
  return response.data;
};

export const getMedico = async (id) => {
  const response = await api.get(`${MEDICO_URL}${id}/`);
  return response.data;
};

export const createMedico = async (data) => {
  const response = await api.post(MEDICO_URL, data);
  return response.data;
};

export const updateMedico = async (id, data) => {
  const response = await api.put(`${MEDICO_URL}${id}/`, data);
  return response.data;
};

export const deleteMedico = async (id) => {
  const response = await api.delete(`${MEDICO_URL}${id}/`);
  return response.data;
};
