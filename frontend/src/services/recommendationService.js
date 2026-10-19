import api from './api';

export const getPersonalizedRecommendations = async (params = {}) => {
  const response = await api.get('/recommendations/personalized', { params });
  return response.data;
};

export const logSearchHistory = async (query) => {
  if (!query || typeof query !== 'string' || query.trim().length < 2) return;
  try {
    await api.post('/recommendations/search-history', { query: query.trim() });
  } catch {
    // Non-fatal
  }
};

export const getSearchHistory = async () => {
  try {
    const response = await api.get('/recommendations/search-history');
    return response.data.history || [];
  } catch {
    return [];
  }
};

const recommendationService = {
  getPersonalizedRecommendations,
  logSearchHistory,
  getSearchHistory,
};

export default recommendationService;
