export const parseCommand = (text) => {
  // Regex: matches "/command something"
  const match = text.match(/^\/(\w+)\s+(.+)$/);
  
  if (!match) {
    return {
      isTimelineEvent: false,
      eventCategory: null,
      cleanContent: text
    };
  }

  const [, command, restOfText] = match;
  let category = null;

  // Map: log -> OBSERVATION, action -> REMEDIATION, decision -> DECISION
  switch (command.toLowerCase()) {
    case 'log':
      category = 'OBSERVATION';
      break;
    case 'action':
      category = 'REMEDIATION';
      break;
    case 'decision':
      category = 'DECISION';
      break;
    default:
      // If it's a slash command we don't recognize, treat it as normal text
      return {
        isTimelineEvent: false,
        eventCategory: null,
        cleanContent: text
      };
  }

  return {
    isTimelineEvent: true,
    eventCategory: category,
    cleanContent: restOfText.trim()
  };
};
