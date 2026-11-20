import API from './api';

export const storyAPI = {
  getAllStories: () => API.get('/stories'),
  getStoryById: (id) => API.get(`/stories/${id}`),
  createStory: (formData) =>
    API.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteStory: (id) => API.delete(`/stories/${id}`),
  reactToStory: (id, emoji) => API.post(`/stories/${id}/react`, { emoji }),
};

export default storyAPI;
