import api from '../../../api/axios';

const CONSENTIMIENTO_URL = '/admision/consentimientos-informados/';

export const getConsentimientos = async (params = {}) => {
  const response = await api.get(CONSENTIMIENTO_URL, { params });
  return response.data;
};

export const getConsentimiento = async (id) => {
  const response = await api.get(`${CONSENTIMIENTO_URL}${id}/`);
  return response.data;
};

export const createConsentimiento = async (data) => {
  const response = await api.post(CONSENTIMIENTO_URL, data);
  return response.data;
};

export const updateConsentimiento = async (id, data) => {
  const response = await api.put(`${CONSENTIMIENTO_URL}${id}/`, data);
  return response.data;
};

export const deleteConsentimiento = async (id) => {
  const response = await api.delete(`${CONSENTIMIENTO_URL}${id}/`);
  return response.data;
};
