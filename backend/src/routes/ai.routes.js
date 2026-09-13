const express = require('express');
const router = express.Router();
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const aiCtrl = require('../controllers/ai.controller');
const rateLimiter = require('../middleware/rateLimiter');

// Chat endpoints (support both authenticated users and guests)
router.post('/chat/stream', optionalAuth, aiCtrl.chatStream);
router.post('/chat', optionalAuth, rateLimiter.ai, aiCtrl.chat);

// Authenticated AI routes
router.use(authenticate);

// Conversations
router.get('/conversations', aiCtrl.listConversations);
router.get('/conversations/:conversationId', aiCtrl.getConversation);
router.delete('/conversations/:conversationId', aiCtrl.deleteConversation);

// Intent classification (internal/authenticated)
router.post('/intent/classify', aiCtrl.classifyIntentEndpoint);

// Tools
router.get('/tools', aiCtrl.listTools);
router.post('/tools/:toolName/execute', aiCtrl.executeSingleTool);

// RAG Knowledge (Admin only)
router.post('/knowledge/documents', authorize('ADMIN'), aiCtrl.createKnowledgeDoc);
router.get('/knowledge/documents', authorize('ADMIN'), aiCtrl.listKnowledgeDocs);
router.get('/knowledge/documents/:documentId', authorize('ADMIN'), aiCtrl.getKnowledgeDoc);
router.patch('/knowledge/documents/:documentId', authorize('ADMIN'), aiCtrl.updateKnowledgeDoc);
router.delete('/knowledge/documents/:documentId', authorize('ADMIN'), aiCtrl.deleteKnowledgeDoc);
router.post('/knowledge/search', authorize('ADMIN'), aiCtrl.searchKnowledge);

// Prompt Registry (Admin only)
router.get('/prompts', authorize('ADMIN'), aiCtrl.listPromptVersions);
router.post('/prompts', authorize('ADMIN'), aiCtrl.createPromptVersion);
router.post('/prompts/:promptId/activate', authorize('ADMIN'), aiCtrl.activatePromptVersion);

module.exports = router;
