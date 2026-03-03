import { addUserToRoom, removeUserFromRoom } from '../services/presenceService.js';
import { parseCommand } from '../services/messageService.js';
import prisma from '../config/db.js';

export const handleChatEvents = (io, socket) => {
  // Join an incident room
  socket.on('join-incident', async ({ incidentId, userId }) => {
    socket.join(incidentId);
    console.log(`Socket ${socket.id} joined incident room: ${incidentId}`);

    // Update Redis presence
    await addUserToRoom(incidentId, userId);
    
    // Broadcast to the room that a user joined (optional, good for frontend UI)
    io.to(incidentId).emit('user-joined', { userId, incidentId });
  });

  // Leave an incident room (explicit leave)
  socket.on('leave-incident', async ({ incidentId, userId }) => {
    socket.leave(incidentId);
    console.log(`Socket ${socket.id} left incident room: ${incidentId}`);

    // Update Redis presence
    await removeUserFromRoom(incidentId, userId);
    
    // Broadcast to the room that a user left
    io.to(incidentId).emit('user-left', { userId, incidentId });
  });

  // Send a real-time message
  socket.on('send-message', async (data) => {
    const { incidentId, userId, content } = data;
    
    try {
      const { isTimelineEvent, eventCategory, cleanContent } = parseCommand(content);

      // 1. Save the message to the database via Prisma
      const message = await prisma.message.create({
        data: {
          content: cleanContent,
          incidentId,
          userId,
          isTimelineEvent,
          eventCategory
        },
        include: {
          user: {
            select: { id: true, username: true, email: true }
          }
        }
      });

      // 2. Broadcast the fully populated message to everyone in the room
      io.to(incidentId).emit('new-message', message);
    } catch (error) {
      console.error('Error handling send-message event:', error);
      // Optional: emit an error back to the sender
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });
};
