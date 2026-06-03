import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';
import { generateReply } from '../src/services/llmService.js';
import { z } from 'zod';
import "dotenv/config";

// 1. Tell Neon to use the standard ws package for WebSocket connections
neonConfig.webSocketConstructor = ws;

// 2. Wrap the connection string config directly in the Neon Prisma adapter
const connectionString = process.env.DATABASE_URL as string;
const adapter = new PrismaNeon({ connectionString });

// 3. Instantiate PrismaClient with the adapter
const prisma = new PrismaClient({ adapter });

const app = express();

// Configure CORS for Vercel and local development
const corsOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://spur-assignment.vercel.app',
  process.env.FRONTEND_URL
].filter((origin): origin is string => Boolean(origin));

const corsOptions = {
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Input validation schema
const chatSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long"),
  sessionId: z.string().nullable().optional(), // Added .nullable() here
});

app.post('/api/chat/message', async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Validate Input
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
    }

    const { message, sessionId } = parsed.data;

    // 2. Resolve or Create Conversation
    let conversationId = sessionId;
    if (!conversationId) {
      const newConv = await prisma.conversation.create({ data: {} });
      conversationId = newConv.id;
    }

    // 3. Save User Message
    await prisma.message.create({
      data: { text: message, sender: 'user', conversationId }
    });

    // 4. Fetch History for Context (Limit to last 10 for cost/token limits)
    const rawHistory = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    const formattedHistory = rawHistory
      .filter(m => m.sender === 'user' || m.sender === 'ai')
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      })) as { role: 'user' | 'assistant', content: string }[];

    // Remove the current message from history to avoid duplication in the API call
    formattedHistory.pop();

    // 5. Call LLM
    let aiReplyText = "";
    try {
      aiReplyText = await generateReply(formattedHistory, message);
    } catch (llmError) {
      // Graceful degradation on LLM failure
      aiReplyText = "I'm currently experiencing technical difficulties. Please try again in a moment.";
    }

    // 6. Save AI Message
    await prisma.message.create({
      data: { text: aiReplyText, sender: 'ai', conversationId }
    });

    // 7. Return Response
    return res.json({ reply: aiReplyText, sessionId: conversationId });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get('/api/chat/history/:sessionId', async (req, res): Promise<any> => {
  const { sessionId } = req.params;
  const messages = await prisma.message.findMany({
    where: { conversationId: sessionId },
    orderBy: { createdAt: 'asc' }
  });
  return res.json(messages);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));