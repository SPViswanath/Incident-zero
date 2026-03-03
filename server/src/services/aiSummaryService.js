import { ai } from '../config/gemini.js';
import prisma from '../config/db.js';

export const generateSummary = async (incidentId) => {
  try {
    // 1. Fetch Incident Data
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: { username: true, role: true }
            }
          }
        },
      }
    });

    if (!incident) throw new Error('Incident not found');
    if (incident.messages.length === 0) throw new Error('No chat history to summarize');

    // 2. Format Context for Gemini
    const chatLog = incident.messages.map(msg => {
      let prefix = `[${msg.createdAt.toISOString()}] ${msg.user.username} (${msg.user.role}):`;
      if (msg.isTimelineEvent) {
        prefix = `[CRITICAL MILESTONE: ${msg.eventCategory}] ${prefix}`;
      }
      return `${prefix} ${msg.content}`;
    }).join('\n');

    const prompt = `
      You are an expert Site Reliability Engineer (SRE).
      Please analyze the following chat log from a resolved incident.
      
      Incident Title: ${incident.title}
      Severity: ${incident.severity}
      Incident Description: ${incident.description || 'N/A'}
      
      Chat Log:
      ${chatLog}
      
      Provide a comprehensive Post-Mortem. 
      IMPORTANT: You must respond in pure JSON format matching exactly this structure:
      {
        "summary": "A 2-3 sentence overarching summary of the incident and resolution.",
        "keyEvents": ["timeline event 1", "timeline event 2"],
        "rootCause": "The underlying technical reason this occurred.",
        "resolutionSteps": ["step 1 taken", "step 2 taken"],
        "recommendations": ["future improvement 1", "future improvement 2"]
      }
      Do not include markdown tags like \`\`\`json around your response. Just return the raw JSON string.
    `;

    // 3. Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const aiResponseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) {
      throw new Error('No valid response string from Gemini API');
    }

    // Parse the JSON strictly
    const parsedData = JSON.parse(aiResponseText.trim());

    // 4. Save to Database
    const summaryRecord = await prisma.incidentSummary.create({
      data: {
        incidentId: incident.id,
        summary: parsedData.summary,
        keyEvents: parsedData.keyEvents,
        rootCause: parsedData.rootCause,
        resolutionSteps: parsedData.resolutionSteps,
        recommendations: parsedData.recommendations,
        generatedBy: 'gemini-2.5-flash'
      }
    });

    console.log(`✅ Successfully generated AI Summary for incident ${incident.id}`);
    return summaryRecord;
    
  } catch (error) {
    console.error('Failed to generate AI summary:', error);
    // Note: Do not throw error here to avoid crashing the whole resolution request
    return null; 
  }
};
