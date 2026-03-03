import redis from '../config/redis.js';

// Prefix for Redis keys to keep them organized
const ROOM_PREFIX = 'incident_room:';

export const addUserToRoom = async (incidentId, userId) => {
  try {
    const roomKey = `${ROOM_PREFIX}${incidentId}`;
    // Add the user to the Redis Set for this incident room
    // Sadd ensures it remains a set of unique IDs
    await redis.sadd(roomKey, userId);
    console.log(`User ${userId} added to incident room ${incidentId}`);
    return true;
  } catch (error) {
    console.error(`Failed to add user to Redis room:`, error);
    return false;
  }
};

export const removeUserFromRoom = async (incidentId, userId) => {
  try {
    const roomKey = `${ROOM_PREFIX}${incidentId}`;
    // Remove the user from the Redis Set
    await redis.srem(roomKey, userId);
    console.log(`User ${userId} removed from incident room ${incidentId}`);
    return true;
  } catch (error) {
    console.error(`Failed to remove user from Redis room:`, error);
    return false;
  }
};

// Bonus helper function: Get all active users in a room
export const getActiveUsersInRoom = async (incidentId) => {
  try {
    const roomKey = `${ROOM_PREFIX}${incidentId}`;
    const users = await redis.smembers(roomKey);
    return users;
  } catch (error) {
    console.error(`Failed to get active users from Redis room:`, error);
    return [];
  }
};
