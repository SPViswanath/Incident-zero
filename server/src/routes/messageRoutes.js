import express from 'express';
import { getMessages, sendMessage, toggleTimeline } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(protect);

router.route('/:incidentId')
  .get(getMessages)
  .post(sendMessage);

router.patch('/:messageId/toggle-timeline', toggleTimeline);

export default router;
