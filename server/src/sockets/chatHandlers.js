import { addUserToRoom, removeUserFromRoom, getActiveUsersInRoom } from '../services/presenceService.js';
import { parseCommand } from '../services/messageService.js';
import prisma from '../config/db.js';

export const handleChatEvents = (io, socket) => {
  // Join an incident room
  socket.on('join-incident', async ({ incidentId, userId }) => {
    socket.join(incidentId);
    console.log(`Socket ${socket.id} joined incident room: ${incidentId}`);

    // Update Redis presence
    await addUserToRoom(incidentId, userId);
    
    // Broadcast active users
    const activeUsers = await getActiveUsersInRoom(incidentId);
    io.to(incidentId).emit('presence-update', activeUsers);
  });

  // Leave an incident room (explicit leave)
  socket.on('leave-incident', async ({ incidentId, userId }) => {
    socket.leave(incidentId);
    console.log(`Socket ${socket.id} left incident room: ${incidentId}`);

    // Update Redis presence
    await removeUserFromRoom(incidentId, userId);
    
    // Broadcast active users
    const activeUsers = await getActiveUsersInRoom(incidentId);
    io.to(incidentId).emit('presence-update', activeUsers);
  });

  // Send a real-time message
  socket.on('send-message', async (data) => {
    const { incidentId, userId, user, content } = data;
    
    try {
      const { isTimelineEvent, eventCategory, cleanContent } = parseCommand(content);

      // 1. Construct an optimistic message object immediately
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content: cleanContent,
        incidentId,
        userId,
        isTimelineEvent,
        eventCategory,
        createdAt: new Date().toISOString(),
        user: user || { id: userId, username: 'User' }
      };

      // 2. Broadcast INSTANTLY to everyone in the room (including sender)
      io.to(incidentId).emit('new-message', optimisticMessage);

      // 3. Save to database asynchronously (Background task)
      prisma.message.create({
        data: {
          content: cleanContent,
          incidentId,
          userId,
          isTimelineEvent,
          eventCategory
        }
      }).catch(err => console.error('Background DB save failed:', err));

    } catch (error) {
      console.error('Error handling send-message event:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });
};
