const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const aiCtrl = require('../controllers/ai.controller');
const rateLimiter = require('../middleware/rateLimiter');

// All AI routes require authentication
router.use(authenticate);

// Chat
router.post('/chat', rateLimiter.ai, aiCtrl.chat);

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
