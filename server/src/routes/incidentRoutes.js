import express from 'express';
import { createIncident, getIncidents, resolveIncident, getIncidentSummary, getIncidentTimeline } from '../controllers/incidentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes in this file
router.use(protect);

router.route('/')
  .post(createIncident)
  .get(getIncidents);

router.patch('/:id/resolve', resolveIncident);
router.get('/:id/summary', getIncidentSummary);
router.get('/:id/timeline', getIncidentTimeline);

export default router;
