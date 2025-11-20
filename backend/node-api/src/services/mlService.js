import axios from 'axios';

const baseURL = process.env.ML_API_BASE_URL || 'http://127.0.0.1:8000';

export const mlService = {
  singlePredict: async (payload) => {
    try {
      const { data } = await axios.post(`${baseURL}/predict/single`, payload);
      return data;
    } catch (error) {
      console.error('ML API single predict error:', error.response?.data || error.message);
      throw error;
    }
  },
  batchPredict: async (payload) => {
    try {
      console.log('Calling ML API batch predict with', payload.records?.length || 0, 'records');
      const { data } = await axios.post(`${baseURL}/predict/batch`, payload, {
        timeout: 60000, // 60 second timeout for batch predictions
      });
      console.log('ML API batch predict response:', {
        hasItems: !!data.items,
        itemsLength: data.items?.length || 0,
        dataKeys: Object.keys(data || {}),
      });
      return data;
    } catch (error) {
      console.error('ML API batch predict error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};
