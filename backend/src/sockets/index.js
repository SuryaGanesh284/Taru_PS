const { Server } = require('socket.io');
const { verifyAccessToken } = require('./services/auth.service');
const logger = require('./utils/logger');

let io = null;

/**
 * Initialize Socket.IO server with JWT auth
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // JWT authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication token required'));

      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      socket.userRole = payload.role;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    // Join user-specific room for targeted notifications
    socket.join(`user:${socket.userId}`);

    socket.on('join:order', ({ orderId }) => {
      socket.join(`order:${orderId}`);
      logger.debug(`Socket ${socket.id} joined order room: ${orderId}`);
    });

    socket.on('join:conversation', ({ conversationId }) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error: ${err.message}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
};

/**
 * Emit an event to a specific user's room
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit an order status change event
 */
const emitOrderEvent = (orderId, event, data) => {
  if (io) {
    io.to(`order:${orderId}`).emit(event, data);
  }
};

/**
 * Emit a streaming AI message chunk
 */
const emitAiChunk = (conversationId, chunk) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit('ai:chunk', chunk);
  }
};

/**
 * Emit AI stream end signal
 */
const emitAiStreamEnd = (conversationId, data) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit('ai:stream_end', data);
  }
};

const getIo = () => io;

module.exports = { initSocket, emitToUser, emitOrderEvent, emitAiChunk, emitAiStreamEnd, getIo };
