const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { requestId } = require('./middleware/requestId');
const rateLimiter = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const sellerRoutes = require('./routes/seller.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const searchRoutes = require('./routes/search.routes');
const eventRoutes = require('./routes/event.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const cartRoutes = require('./routes/cart.routes');
const addressRoutes = require('./routes/address.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const webhookRoutes = require('./routes/webhook.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const notificationRoutes = require('./routes/notification.routes');
const reviewRoutes = require('./routes/review.routes');
const aiRoutes = require('./routes/ai.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
}));

// Compression
app.use(compression());

// HTTP logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Cookie parser
app.use(cookieParser());

// Request ID middleware (must be before routes)
app.use(requestId);

// Webhooks need raw body — register before json parser
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter
app.use(rateLimiter.global);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), requestId: req.requestId });
});

// API routes
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/sellers`, sellerRoutes);
app.use(`${API}/seller`, sellerRoutes);
app.use(`${API}/categories`, categoryRoutes);
app.use(`${API}/products/:productId/reviews`, reviewRoutes);
app.use(`${API}/products`, productRoutes);
app.use(`${API}/search`, searchRoutes);
app.use(`${API}/events`, eventRoutes);
app.use(`${API}/recommendations`, recommendationRoutes);
app.use(`${API}/wishlist`, wishlistRoutes);
app.use(`${API}/cart`, cartRoutes);
app.use(`${API}/addresses`, addressRoutes);
app.use(`${API}/checkout`, checkoutRoutes);
app.use(`${API}/orders`, orderRoutes);
app.use(`${API}/payments`, paymentRoutes);
app.use(`${API}/shipments`, shipmentRoutes);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/reviews`, reviewRoutes);
app.use(`${API}/ai`, aiRoutes);
app.use(`${API}/admin`, adminRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
