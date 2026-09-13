# Taru Rural E-Commerce — Backend API

A production-grade Node.js + Express MERN backend for the **Taru Rural E-Commerce Marketplace**, connecting rural Self Help Group (SHG) sellers with buyers.

---

## 🏗️ Architecture

```
src/
├── app.js              # Express app, all middleware, route mounts
├── server.js           # HTTP + Socket.IO server entry point
├── config/
│   ├── db.js           # MongoDB connection
│   └── redis.js        # Redis connection
├── middleware/
│   ├── auth.js         # JWT authenticate / RBAC authorize middleware
│   ├── errorHandler.js # AppError class + global error handler
│   ├── rateLimiter.js  # Per-category rate limiting
│   └── requestId.js    # Request tracing ID
├── models/             # 22 Mongoose models (see below)
├── controllers/        # Route handler logic
├── routes/             # Express Router definitions
├── services/
│   └── auth.service.js # JWT, bcrypt, session management
├── sockets/
│   └── index.js        # Socket.IO real-time layer
└── utils/
    ├── logger.js       # Winston structured logger
    ├── response.js     # Standardized success/paginated/created helpers
    └── audit.js        # Audit log utility
```

---

## 🗄️ MongoDB Models

| Model | Purpose |
|---|---|
| `User` | Identity, RBAC, preferences |
| `RefreshSession` | Revocable JWT refresh tokens |
| `SellerProfile` | SHG seller profile, verification |
| `Category` | Hierarchical product taxonomy |
| `Product` | Catalog (STANDARD / UNIQUE / MADE_TO_ORDER) |
| `InventoryItem` | Stock control with concurrency version field |
| `Cart` | Shopping cart with price snapshots |
| `Address` | User delivery addresses |
| `Order` | Full order lifecycle state machine |
| `Payment` | Provider-agnostic payment record |
| `Shipment` | Delivery tracking with event timeline |
| `Invoice` | Line-item invoice with PDF URL |
| `Review` | Verified-purchase reviews |
| `Wishlist` | User saved products |
| `Event` | Behavior signals (90-day TTL) |
| `Recommendation` | Cached personalized lists |
| `Notification` | In-app/email/SMS/push (60-day TTL) |
| `Conversation` | AI chat sessions with message history |
| `KnowledgeDocument` | RAG knowledge base |
| `PromptVersion` | Versioned AI prompt fragments |
| `AiRun` | AI observability (intent, latency, tools) |
| `AuditLog` | Destructive action audit trail (1-year TTL) |

---

## 🌐 API Endpoints

### Base URL: `/api/v1`

All responses include `requestId` for tracing:
```json
{ "data": {...}, "meta": { "requestId": "req_abc123", "page": 1 } }
```

| Module | Endpoints |
|---|---|
| **Auth** | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `GET /auth/me` |
| **Users** | `PATCH /users/me`, `PATCH /users/me/password`, `GET/DELETE /users/me/sessions/:id` |
| **Sellers** | `POST/GET/PATCH /sellers/profile`, `GET /sellers/:id`, `GET /sellers/me/dashboard,products,orders,analytics` |
| **Categories** | `GET /categories`, `GET /categories/:id`, `POST/PATCH/DELETE /categories` (admin) |
| **Products** | `GET/POST /products`, `GET/PATCH/DELETE /products/:id`, `/publish`, `/unpublish`, `/media`, `/inventory` |
| **Search** | `GET /search?q=&category=&minPrice=&maxPrice=&sort=` |
| **Events** | `POST /events` (behavior tracking) |
| **Wishlist** | `GET/POST /wishlist`, `DELETE /wishlist/:productId` |
| **Cart** | `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:id`, `POST /cart/validate` |
| **Addresses** | `GET/POST /addresses`, `PATCH/DELETE /addresses/:id` |
| **Checkout** | `POST /checkout/quote`, `POST /checkout/create-order` |
| **Orders** | `GET/GET/:id /orders`, `POST /orders/:id/cancel`, `GET /orders/:id/tracking,invoice` |
| **Payments** | `POST /payments/create-intent`, `GET /payments/:id/status` |
| **Webhooks** | `POST /webhooks/payments/:provider` (signature-verified) |
| **Shipments** | `GET /shipments/:id`, `POST /shipments`, `POST /shipments/:id/events` |
| **Reviews** | `GET/POST /products/:id/reviews`, `PATCH/DELETE /reviews/:id` |
| **Notifications** | `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read` |
| **Recommendations** | `GET /recommendations`, `POST /recommendations/feedback` |
| **AI Chat** | `POST /ai/chat`, `GET/DELETE /ai/conversations`, `POST /ai/intent/classify` |
| **AI Tools** | `GET /ai/tools`, `POST /ai/tools/:name/execute` |
| **AI Knowledge** | `CRUD /ai/knowledge/documents`, `POST /ai/knowledge/search` |
| **AI Prompts** | `GET/POST /ai/prompts`, `POST /ai/prompts/:id/activate` |
| **Admin** | `GET /admin/stats`, user management, seller verification, product moderation, refunds, audit logs, AI runs |

---

## 🔐 Security

- **Passwords**: bcryptjs with 12 rounds
- **Auth**: Short-lived JWTs (15m access) + revocable refresh sessions (30d)
- **RBAC**: `BUYER` | `SELLER` | `ADMIN` enforced on every protected route
- **Rate Limiting**: Auth (20/15min), AI (30/min), Search (60/min), Payments (10/min), Global (100/min)
- **Webhook Security**: HMAC-SHA256 signature verification + idempotent event deduplication
- **Unique Item Safety**: MongoDB transactions for atomic inventory reservation
- **Audit Logging**: All privileged/destructive actions recorded

---

## ⚡ Real-Time (Socket.IO)

- JWT authentication on WebSocket handshake
- Per-user rooms (`user:<userId>`) for notifications
- Per-order rooms (`order:<orderId>`) for live order status
- Per-conversation rooms for AI streaming chunks

---

## 🚀 Getting Started

```bash
cp .env.example .env
# Fill in MONGO_URI, JWT secrets, etc.

npm install
npm run dev
```

### Environment Variables
See [`.env.example`](.env.example) for all required variables.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express.js 4 |
| Database | MongoDB + Mongoose |
| Cache/Queue | Redis + ioredis |
| Real-time | Socket.IO 4 |
| Auth | JWT + bcryptjs |
| Validation | Joi |
| Logging | Winston |
| Rate Limiting | express-rate-limit |
