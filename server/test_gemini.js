import 'dotenv/config';
import { generateSummary } from './src/services/aiSummaryService.js';

const test = async () => {
  console.log('Testing Gemini Summary...');
  // Force a call to generate summary with the specific incident ID from the screenshot
  const result = await generateSummary('1c906849-26ae-465e-a057-3a97c83f6867');
  console.log('Result:', result);
  process.exit(0);
};

test();
