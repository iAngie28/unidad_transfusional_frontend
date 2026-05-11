import api from '../../../api/axios';

const SOLICITUD_URL = '/admision/solicitudes-transfusion/';

export const getSolicitudes = async (params = {}) => {
  const response = await api.get(SOLICITUD_URL, { params });
  return response.data;
};

export const getSolicitud = async (id) => {
  const response = await api.get(`${SOLICITUD_URL}${id}/`);
  return response.data;
};

export const createSolicitud = async (data) => {
  const response = await api.post(SOLICITUD_URL, data);
  return response.data;
};

export const updateSolicitud = async (id, data) => {
  const response = await api.put(`${SOLICITUD_URL}${id}/`, data);
  return response.data;
};

export const deleteSolicitud = async (id) => {
  const response = await api.delete(`${SOLICITUD_URL}${id}/`);
  return response.data;
};
