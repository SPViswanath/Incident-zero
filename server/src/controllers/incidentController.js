import prisma from '../config/db.js';

// @desc    Create a new incident (War Room)
// @route   POST /api/incidents
// @access  Private
export const createIncident = async (req, res) => {
  try {
    const { title, description, severity } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Please provide a title for the incident' });
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        severity: severity || 'MEDIUM',
        createdById: req.userId,
      },
    });

    res.status(201).json({
      message: 'Incident created successfully',
      incident
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ message: 'Server error creating incident' });
  }
};

// @desc    Get all active incidents
// @route   GET /api/incidents
// @access  Private
export const getIncidents = async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        status: 'ACTIVE'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        _count: {
          select: { participants: true, messages: true }
        }
      }
    });

    res.status(200).json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ message: 'Server error fetching incidents' });
  }
};

import { generateSummary } from '../services/aiSummaryService.js';

// @desc    Resolve an incident and trigger AI Summary
// @route   PATCH /api/incidents/:id/resolve
// @access  Private
export const resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({ where: { id } });
    
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
      return res.status(400).json({ message: 'Incident is already resolved or closed' });
    }

    // Mark as resolved
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: { 
        status: 'RESOLVED',
        resolvedAt: new Date()
      }
    });

    // Trigger AI Summarization asynchronously (fire and forget)
    // We don't await this because we want to respond to the client quickly
    generateSummary(id);

    res.status(200).json({
      message: 'Incident marked as RESOLVED. AI is now generating the post-mortem summary.',
      incident: updatedIncident
    });

  } catch (error) {
    console.error('Error resolving incident:', error);
    res.status(500).json({ message: 'Server error resolving incident' });
  }
};

// @desc    Get the AI Summary of a resolved incident
// @route   GET /api/incidents/:id/summary
// @access  Private
export const getIncidentSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const summary = await prisma.incidentSummary.findUnique({
      where: { incidentId: id }
    });

    if (!summary) {
      return res.status(404).json({ message: 'Summary not found. It may still be generating.' });
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching incident summary:', error);
    res.status(500).json({ message: 'Server error fetching summary' });
  }
};

// @desc    Get the Timeline of an incident
// @route   GET /api/incidents/:id/timeline
// @access  Private
export const getIncidentTimeline = async (req, res) => {
  try {
    const { id } = req.params;

    const timeline = await prisma.message.findMany({
      where: {
        incidentId: id,
        isTimelineEvent: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        user: {
          select: { id: true, username: true, email: true }
        }
      }
    });

    res.status(200).json(timeline);
  } catch (error) {
    console.error('Error fetching incident timeline:', error);
    res.status(500).json({ message: 'Server error fetching incident timeline' });
  }
};
