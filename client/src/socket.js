import { io } from 'socket.io-client';

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

export const socket = io(baseURL, {
  autoConnect: false // Connect manually when needed
});
