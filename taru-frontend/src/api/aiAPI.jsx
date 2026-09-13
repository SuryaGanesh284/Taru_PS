import axiosInstance from './axiosInstance.jsx'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

export const aiAPI = {
  // Standard chat (non-streaming)
  sendMessage: (data) => axiosInstance.post('/ai/chat', data),

  // Get conversation history
  getConversation: (conversationId) =>
    axiosInstance.get(`/ai/conversations/${conversationId}`),

  // List conversations
  getConversations: () => axiosInstance.get('/ai/conversations'),

  // Delete a conversation
  deleteConversation: (conversationId) =>
    axiosInstance.delete(`/ai/conversations/${conversationId}`),

  // Streaming chat — returns a raw fetch response for SSE streaming
  streamMessage: async (data, accessToken) => {
    const response = await fetch(`${BASE_URL}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })
    return response
  },
}
