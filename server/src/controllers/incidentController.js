import prisma from '../config/db.js';

// @desc    Create a new incident (War Room)
// @route   POST /api/incidents
// @access  Private
export const createIncident = async (req, res) => {
  try {
    const { title, description, severity, category } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Please provide a title for the incident' });
    }

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        severity: severity || 'MEDIUM',
        category: category || 'SOFTWARE',
        createdById: req.userId,
      },
    });

    res.status(201).json({
      message: 'Incident created successfully',
      incident
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ message: error.message || 'Server error creating incident' });
  }
};

// @desc    Get all active incidents
// @route   GET /api/incidents
// @access  Private
export const getIncidents = async (req, res) => {
  try {
    const incidents = await prisma.incident.findMany({
      where: {
        OR: [
          { createdById: req.userId },
          { participants: { some: { userId: req.userId } } }
        ]
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
    res.status(500).json({ message: error.message || 'Server error fetching incidents' });
  }
};

// @desc    Get incident by ID
// @route   GET /api/incidents/:id
// @access  Private
export const getIncidentById = async (req, res) => {
  try {
    const { id } = req.params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, username: true, email: true } },
        participants: { include: { user: { select: { id: true, username: true, email: true } } } },
      }
    });

    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }

    // Verify access
    const isCreator = incident.createdById === req.userId;
    const isParticipant = incident.participants.some(p => p.userId === req.userId);
    
    if (!isCreator && !isParticipant) {
      // Auto-join if they have the link and are logged in
      await prisma.incidentParticipant.create({
        data: {
          userId: req.userId,
          incidentId: id
        }
      });
      
      // Re-fetch with the new participant included
      const updatedIncident = await prisma.incident.findUnique({
        where: { id },
        include: {
          createdBy: { select: { id: true, username: true, email: true } },
          participants: { include: { user: { select: { id: true, username: true, email: true } } } },
        }
      });
      
      return res.status(200).json(updatedIncident);
    }

    res.status(200).json(incident);
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ message: 'Server error fetching incident' });
  }
};

import { generateSummary } from '../services/aiSummaryService.js';

// @desc    Resolve an incident and trigger AI Summary
// @route   PATCH /api/incidents/:id/resolve
// @access  Private
export const resolveIncident = async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findFirst({ 
      where: { 
        id,
        OR: [
          { createdById: req.userId },
          { participants: { some: { userId: req.userId } } }
        ]
      } 
    });
    
    if (!incident) {
      return res.status(403).json({ message: 'Access denied or incident not found' });
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

    // Check access first
    const incident = await prisma.incident.findFirst({
      where: {
        id,
        OR: [
          { createdById: req.userId },
          { participants: { some: { userId: req.userId } } }
        ]
      }
    });

    if (!incident) {
      return res.status(403).json({ message: 'Access denied or incident not found' });
    }

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

// @desc    Get all AI Summaries (Reports)
// @route   GET /api/incidents/reports/all
// @access  Private
export const getAllSummaries = async (req, res) => {
  try {
    const summaries = await prisma.incidentSummary.findMany({
      where: {
        incident: {
          OR: [
            { createdById: req.userId },
            { participants: { some: { userId: req.userId } } }
          ]
        }
      },
      include: {
        incident: {
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
            createdBy: {
              select: { username: true }
            }
          }
        }
      },
      orderBy: {
        generatedAt: 'desc'
      }
    });

    res.status(200).json(summaries);
  } catch (error) {
    console.error('Error fetching all summaries:', error);
    res.status(500).json({ message: 'Server error fetching reports' });
  }
};

// @desc    Get the Timeline of an incident
// @route   GET /api/incidents/:id/timeline
// @access  Private
export const getIncidentTimeline = async (req, res) => {
  try {
    const { id } = req.params;

    // Check access first
    const incidentAccess = await prisma.incident.findFirst({
      where: {
        id,
        OR: [
          { createdById: req.userId },
          { participants: { some: { userId: req.userId } } }
        ]
      }
    });

    if (!incidentAccess) {
      return res.status(403).json({ message: 'Access denied or incident not found' });
    }

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
