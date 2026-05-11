import api from '../../../api/axios';

const PRUEBAS_PAC_URL = '/laboratorio/pruebas-pac/';

export const getPruebasPac = async (params = {}) => {
  const response = await api.get(PRUEBAS_PAC_URL, { params });
  return response.data;
};

export const getPruebaPac = async (id) => {
  const response = await api.get(`${PRUEBAS_PAC_URL}${id}/`);
  return response.data;
};

export const createPruebaPac = async (data) => {
  const response = await api.post(PRUEBAS_PAC_URL, data);
  return response.data;
};

export const updatePruebaPac = async (id, data) => {
  const response = await api.put(`${PRUEBAS_PAC_URL}${id}/`, data);
  return response.data;
};

export const deletePruebaPac = async (id) => {
  const response = await api.delete(`${PRUEBAS_PAC_URL}${id}/`);
  return response.data;
};
