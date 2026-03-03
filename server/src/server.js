import 'dotenv/config';
import app from './app.js';
import prisma from './config/db.js';
import { initSocket } from './config/socket.js'; // Import custom Socket config

const PORT = process.env.PORT || 3000;

// Start the Express HTTP server first
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    // Verify database connection by making a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connected successfully via Prisma');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
});

// Initialize Socket.io by passing the HTTP server instance
initSocket(server);

export default server;
