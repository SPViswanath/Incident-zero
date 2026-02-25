import { Server } from 'socket.io';
import { handleChatEvents } from '../sockets/chatHandlers.js';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development, allow all. In production, restrict to frontend URL
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected to Socket.io: ${socket.id}`);

    // Register Chat Event Handlers
    handleChatEvents(io, socket);
    
    socket.on('disconnect', () => {
      console.log(`User disconnected from Socket.io: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
