import prisma from '../config/db.js';
import { getIO } from '../config/socket.js';
import { parseCommand } from '../services/messageService.js';

// @desc    Get all messages for an incident
// @route   GET /api/messages/:incidentId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { incidentId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        incidentId
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

// @desc    Send a message (REST backup)
// @route   POST /api/messages/:incidentId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const { isTimelineEvent, eventCategory, cleanContent } = parseCommand(content);

    const message = await prisma.message.create({
      data: {
        content: cleanContent,
        incidentId,
        userId: req.userId,
        isTimelineEvent,
        eventCategory
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    // Optionally broadcast via socket.io as a backup payload if sent via REST
    try {
      const io = getIO();
      // Emitting to the specific incident room
      io.to(incidentId).emit('new-message', message);
    } catch (socketError) {
      console.warn('Socket emit failed for REST message:', socketError.message);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};

// @desc    Toggle whether a message is an official timeline event
// @route   PATCH /api/messages/:messageId/toggle-timeline
// @access  Private
export const toggleTimeline = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Toggle the boolean
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isTimelineEvent: !message.isTimelineEvent
      },
      include: {
        user: { select: { id: true, username: true, email: true } }
      }
    });

    // Broadcast the update so frontends can instantly add/remove the 'Timeline' badge
    try {
      const io = getIO();
      io.to(updatedMessage.incidentId).emit('message-updated', updatedMessage);
    } catch (socketError) {
      console.warn('Socket emit failed for toggle timeline:', socketError.message);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error('Error toggling timeline event:', error);
    res.status(500).json({ message: 'Server error toggling timeline event' });
  }
};
