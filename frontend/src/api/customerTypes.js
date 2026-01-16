import api from '../api/axios';

export const fetchCustomerTypes = async () => {
  const response = await api.get('/api/customertypes/');
  return response.data;
};

export const addCustomerType = async (typeData) => {
  const response = await api.post('/api/customertypes/', typeData);
  return response.data;
};
