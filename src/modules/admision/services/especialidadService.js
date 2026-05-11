import api from '../../../api/axios';

const ESPECIALIDAD_URL = '/admision/especialidades/';

export const getEspecialidades = async (params = {}) => {
  const response = await api.get(ESPECIALIDAD_URL, { params });
  return response.data;
};

export const getEspecialidad = async (id) => {
  const response = await api.get(`${ESPECIALIDAD_URL}${id}/`);
  return response.data;
};

export const createEspecialidad = async (data) => {
  const response = await api.post(ESPECIALIDAD_URL, data);
  return response.data;
};

export const updateEspecialidad = async (id, data) => {
  const response = await api.put(`${ESPECIALIDAD_URL}${id}/`, data);
  return response.data;
};

export const deleteEspecialidad = async (id) => {
  const response = await api.delete(`${ESPECIALIDAD_URL}${id}/`);
  return response.data;
};
