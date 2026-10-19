
import api from './api';

export const getRecipes = async (filters = {}) => {
  const response = await api.get('/recipes/', {
    params: filters,
  });

  const data = response.data;
  return Array.isArray(data)
    ? data
    : data.recipes || data.items || [];
};

export const getRecipe = async (id) => {
  const response = await api.get(`/recipes/${id}`);
  return response.data.recipe || response.data;
};

export const createRecipe = async (recipe) => {
  const response = await api.post('/recipes/', recipe);
  return response.data;
};

export const updateRecipe = async (id, recipe) => {
  const response = await api.put(`/recipes/${id}`, recipe);
  return response.data;
};

export const deleteRecipe = async (id) => {
  const response = await api.delete(`/recipes/${id}`);
  return response.data;
};

export const getFavorites = async () => {
  const response = await api.get('/favorites/');
  const data = response.data;

  return Array.isArray(data)
    ? data
    : data.favorites || data.items || [];
};

export const addFavorite = async (recipeId) => {
  const response = await api.post(
    `/favorites/${recipeId}`
  );
  return response.data;
};

export const removeFavorite = async (recipeId) => {
  const response = await api.delete(
    `/favorites/${recipeId}`
  );
  return response.data;
};

export const parseRecipeUrl = async (url) => {
  const response = await api.post('/recipes/parse-url', { url });
  return response.data;
};

export const publishRecipeFromUrl = async (url) => {
  const response = await api.post('/recipes/publish-url', { url });
  return response.data;
};

export const uploadCookingVideo = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('video', file);
  const response = await api.post('/uploads/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
  return response.data;
};

export const uploadRecipeImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

const recipeService = {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getFavorites,
  addFavorite,
  removeFavorite,
  parseRecipeUrl,
  publishRecipeFromUrl,
  uploadCookingVideo,
  uploadRecipeImage,
};

export default recipeService;

