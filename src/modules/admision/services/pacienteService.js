import api from '../../../api/axios';

const PACIENTE_URL = '/admision/pacientes/';

export const getPacientes = async (params = {}) => {
  const response = await api.get(PACIENTE_URL, { params });
  return response.data;
};

export const getPaciente = async (id) => {
  const response = await api.get(`${PACIENTE_URL}${id}/`);
  return response.data;
};

export const createPaciente = async (data) => {
  const response = await api.post(PACIENTE_URL, data);
  return response.data;
};

export const updatePaciente = async (id, data) => {
  const response = await api.put(`${PACIENTE_URL}${id}/`, data);
  return response.data;
};

export const deletePaciente = async (id) => {
  const response = await api.delete(`${PACIENTE_URL}${id}/`);
  return response.data;
};
