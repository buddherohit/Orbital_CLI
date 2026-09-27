import express from "express";
import { auth } from "./lib/auth.js";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import cors from "cors";
import prisma from "./lib/db.js";
import { ChatService } from "./services/chat.services.js";

const app = express();
const port = 3005;
const chatService = new ChatService();

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

// Helper to authenticate request
async function getSessionFromReq(req) {
  try {
    return await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
  } catch (err) {
    return null;
  }
}

// User session endpoint
app.get("/api/me", async (req, res) => {
  try {
    const session = await getSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ error: "No active session" });
    }
    return res.json(session);
  } catch (error) {
    console.error("Session error:", error);
    return res.status(500).json({ error: "Failed to get session", details: error.message });
  }
});

app.get("/api/me/:access_token", async (req, res) => {
  const { access_token } = req.params;
  try {
    const session = await auth.api.getSession({
      headers: {
        authorization: `Bearer ${access_token}`,
      },
    });

    if (!session) {
      return res.status(401).json({ error: "Invalid token" });
    }

    return res.json(session);
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(401).json({ error: "Unauthorized", details: error.message });
  }
});

// Dashboard stats endpoint
app.get("/api/stats", async (req, res) => {
  try {
    const session = await getSessionFromReq(req);
    const userId = session?.user?.id;

    const totalConversations = await prisma.conversation.count({
      where: userId ? { userId } : {},
    });

    const totalMessages = await prisma.message.count({
      where: userId ? { conversation: { userId } } : {},
    });

    const chatCount = await prisma.conversation.count({
      where: { ...(userId ? { userId } : {}), mode: "chat" },
    });

    const toolCount = await prisma.conversation.count({
      where: { ...(userId ? { userId } : {}), mode: "tool" },
    });

    const agentCount = await prisma.conversation.count({
      where: { ...(userId ? { userId } : {}), mode: "agent" },
    });

    return res.json({
      totalConversations,
      totalMessages,
      breakdown: { chat: chatCount, tool: toolCount, agent: agentCount },
      status: "ONLINE",
      model: process.env.ORBITAI_MODEL || "gemini-2.5-flash",
      database: "PostgreSQL (Neon Connected)",
    });
  } catch (error) {
    console.error("Stats error:", error);
    return res.status(500).json({ error: "Failed to fetch stats", details: error.message });
  }
});

// Dashboard conversation history endpoint
app.get("/api/conversations", async (req, res) => {
  try {
    const session = await getSessionFromReq(req);
    let userId = session?.user?.id;

    // Fallback: If not authenticated via session cookie, get recent conversations
    let conversations;
    if (userId) {
      conversations = await prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { messages: true },
          },
        },
      });
    } else {
      conversations = await prisma.conversation.findMany({
        take: 20,
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { messages: true },
          },
        },
      });
    }

    return res.json(conversations);
  } catch (error) {
    console.error("Conversations error:", error);
    return res.status(500).json({ error: "Failed to fetch conversations", details: error.message });
  }
});

// Dashboard single conversation with all messages
app.get("/api/conversations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    return res.json(conversation);
  } catch (error) {
    console.error("Conversation detail error:", error);
    return res.status(500).json({ error: "Failed to fetch conversation details", details: error.message });
  }
});

app.get("/device", async (req, res) => {
  const { user_code } = req.query;
  res.redirect(`http://localhost:3000/device?user_code=${user_code}`);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});