import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Initialize Supabase Clients lazily with environment checks
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseServiceKey || supabaseAnonKey));

// Public client (for standard auth operations)
const publicSupabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey)
  : null;

// Server-only client with service role key (bypasses RLS for trusted server operations)
const dbSupabase: SupabaseClient | null = (isSupabaseConfigured && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : publicSupabase;

// In-Memory Dev/Fallback Store when Supabase keys are not provided
interface DevUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
}

interface DevMessage {
  id: string;
  sender_username: string;
  receiver_username: string;
  content: string;
  created_at: string;
}

const fallbackUsers: Map<string, DevUser> = new Map([
  ["user-akhil", { id: "user-akhil", email: "akhil@ku.edu.np", username: "akhil_b", passwordHash: "password" }],
  ["user-sirjan", { id: "user-sirjan", email: "sirjan@tu.edu.np", username: "sirjan_b", passwordHash: "password" }],
  ["user-priya", { id: "user-priya", email: "priya@ioe.edu.np", username: "priya_g", passwordHash: "password" }],
  ["user-rohan", { id: "user-rohan", email: "rohan@apex.edu.np", username: "rohan_t", passwordHash: "password" }],
  ["user-aayush", { id: "user-aayush", email: "student@tu.edu.np", username: "aayush_s", passwordHash: "password" }],
]);

const fallbackMessages: DevMessage[] = [
  {
    id: "m1",
    sender_username: "akhil_b",
    receiver_username: "aayush_s",
    content: "Hey! The routing table lookup is completely optimized now.",
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "m2",
    sender_username: "aayush_s",
    receiver_username: "akhil_b",
    content: "Awesome! Did you test message persistence as well?",
    created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "m3",
    sender_username: "akhil_b",
    receiver_username: "aayush_s",
    content: "Yes, everything works reliably even during network drops.",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "m4",
    sender_username: "sirjan_b",
    receiver_username: "aayush_s",
    content: "Would you like to review the updated typography and layout guidelines?",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  }
];

interface AuthenticatedWebSocket extends WebSocket {
  name?: string;
  isAlive?: boolean;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // ─────────────────────────────────────────────────────────────
  // WEBSOCKET SERVER (Port 3000 /ws with exact protocol from user's backend)
  // ─────────────────────────────────────────────────────────────
  const wss = new WebSocketServer({ server, path: "/ws" });
  const clients = new Map<string, AuthenticatedWebSocket>();

  wss.on("connection", (socket: AuthenticatedWebSocket) => {
    socket.isAlive = true;
    console.log("✅ New client connected (not yet authenticated)");

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", async (data) => {
      // 1. Parse raw text as JSON safely
      let msg: any;
      try {
        msg = JSON.parse(data.toString());
      } catch (err) {
        socket.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
        return;
      }

      // 2. Auth message type: { type: 'auth', token: '...' }
      if (msg.type === "auth") {
        let username: string | null = null;

        if (dbSupabase && msg.token && msg.token !== "dev-token-guest" && !msg.token.startsWith("dev-token-")) {
          try {
            const { data: userData, error } = await dbSupabase.auth.getUser(msg.token);
            if (error || !userData?.user) {
              socket.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }));
              socket.close();
              return;
            }

            const { data: profile, error: profileError } = await dbSupabase
              .from("profiles")
              .select("username")
              .eq("id", userData.user.id)
              .single();

            if (profileError || !profile) {
              socket.send(JSON.stringify({ type: "auth_error", message: "No profile found" }));
              socket.close();
              return;
            }

            username = profile.username;
          } catch (err: any) {
            console.error("Supabase auth verification failed:", err);
            socket.send(JSON.stringify({ type: "auth_error", message: err.message || "Auth failed" }));
            socket.close();
            return;
          }
        } else {
          // Dev / Fallback Token Auth
          if (msg.token && msg.token.startsWith("dev-token-")) {
            const requestedUsername = msg.token.replace("dev-token-", "");
            username = requestedUsername;
          } else if (msg.username) {
            username = msg.username;
          } else {
            username = "aayush_s";
          }
        }

        if (!username) {
          socket.send(JSON.stringify({ type: "auth_error", message: "Could not authenticate user" }));
          socket.close();
          return;
        }

        socket.name = username;
        clients.set(socket.name, socket);
        console.log(`👤 Authenticated as: ${socket.name}`);

        // 3. Structured auth_success response
        socket.send(JSON.stringify({ type: "auth_success", username: socket.name }));

        // Send chat history for receiver
        if (dbSupabase) {
          try {
            const { data: history, error: historyError } = await dbSupabase
              .from("messages")
              .select("sender_username, receiver_username, content, created_at")
              .or(`receiver_username.eq.${socket.name},sender_username.eq.${socket.name}`)
              .order("created_at", { ascending: true });

            if (!historyError && history && history.length > 0) {
              socket.send(
                JSON.stringify({
                  type: "history",
                  messages: history.map((m: any) => ({
                    from: m.sender_username,
                    to: m.receiver_username,
                    content: m.content,
                    timestamp: m.created_at,
                  })),
                })
              );
              console.log(`📜 Sent ${history.length} past message(s) to ${socket.name}`);
            }
          } catch (err) {
            console.error("Error fetching message history:", err);
          }
        } else {
          // Fallback in-memory history
          const userMessages = fallbackMessages.filter(
            (m) => m.receiver_username === socket.name || m.sender_username === socket.name
          );
          if (userMessages.length > 0) {
            socket.send(
              JSON.stringify({
                type: "history",
                messages: userMessages.map((m) => ({
                  from: m.sender_username,
                  to: m.receiver_username,
                  content: m.content,
                  timestamp: m.created_at,
                })),
              })
            );
          }
        }

        // Broadcast online presence
        broadcastPresence();
        return;
      }

      // 4. Guard: Reject unauthenticated frames
      if (!socket.name) {
        socket.send(JSON.stringify({ type: "error", message: "Not authenticated yet" }));
        return;
      }

      // 5. Chat message handling: { type: 'message', to: '...', content: '...' }
      if (msg.type === "message") {
        const { to, content } = msg;
        if (!to || !content) {
          socket.send(JSON.stringify({ type: "error", message: "Missing 'to' or 'content' field" }));
          return;
        }

        // Save to Supabase messages table
        if (dbSupabase) {
          try {
            const { error } = await dbSupabase
              .from("messages")
              .insert({ sender_username: socket.name, receiver_username: to, content });

            if (error) {
              console.log("⚠️ Error saving message to Supabase:", error.message);
            } else {
              console.log(`💾 Saved message from ${socket.name} to ${to}`);
            }
          } catch (err: any) {
            console.error("Supabase insert error:", err);
          }
        } else {
          // Fallback persistence
          fallbackMessages.push({
            id: "msg-" + Date.now(),
            sender_username: socket.name,
            receiver_username: to,
            content,
            created_at: new Date().toISOString(),
          });
        }

        const targetSocket = clients.get(to);

        if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
          targetSocket.send(
            JSON.stringify({
              type: "message",
              from: socket.name,
              to,
              content,
              timestamp: new Date().toISOString(),
            })
          );
          console.log(`➡️ Routed message from ${socket.name} to ${to}`);
        } else {
          console.log(`⚠️ ${to} is not connected — message saved for later`);
          socket.send(
            JSON.stringify({
              type: "error",
              message: `${to} is not online, message saved`,
            })
          );
        }
        return;
      }

      if (msg.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
        return;
      }

      // 6. Unknown message type
      socket.send(JSON.stringify({ type: "error", message: `Unknown message type: ${msg.type}` }));
    });

    socket.on("close", () => {
      if (socket.name) {
        clients.delete(socket.name);
        console.log(`❌ ${socket.name} disconnected`);
        broadcastPresence();
      }
    });
  });

  function broadcastPresence() {
    const onlineUsernames = Array.from(clients.keys());
    const presencePayload = JSON.stringify({
      type: "presence",
      onlineUsers: onlineUsernames,
    });
    for (const client of clients.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(presencePayload);
      }
    }
  }

  // Periodic heartbeat cleanup
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  // ─────────────────────────────────────────────────────────────
  // REST API ENDPOINTS
  // ─────────────────────────────────────────────────────────────

  // Health & Config status
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      supabaseConfigured: isSupabaseConfigured,
      activeClients: clients.size,
    });
  });

  // Login: signInWithPassword matching login.js
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (publicSupabase) {
      try {
        const { data, error } = await publicSupabase.auth.signInWithPassword({ email, password });

        if (error) {
          return res.status(401).json({ error: error.message });
        }

        // Fetch username from profiles table
        const { data: profile, error: profileError } = await (dbSupabase || publicSupabase)
          .from("profiles")
          .select("username")
          .eq("id", data.user.id)
          .maybeSingle();

        const username = profile?.username || email.split("@")[0];

        return res.json({
          session: data.session,
          user: data.user,
          username,
          token: data.session?.access_token,
        });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }

    // Fallback Dev Authentication
    const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
    const devToken = `dev-token-${username}`;

    if (!fallbackUsers.has(username)) {
      fallbackUsers.set(username, {
        id: `user-${username}`,
        email,
        username,
        passwordHash: password,
      });
    }

    return res.json({
      session: { access_token: devToken },
      user: { id: `user-${username}`, email },
      username,
      token: devToken,
    });
  });

  // Signup: Unique username validation + profile creation matching login.js
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, and username are required" });
    }

    if (publicSupabase) {
      try {
        // Enforce uniqueness on profiles table
        const { data: existing } = await (dbSupabase || publicSupabase)
          .from("profiles")
          .select("username")
          .eq("username", username)
          .maybeSingle();

        if (existing) {
          return res.status(400).json({ error: "That username is already taken — try another." });
        }

        const { data, error } = await publicSupabase.auth.signUp({ email, password });

        if (error) {
          return res.status(400).json({ error: error.message });
        }

        if (!data.user) {
          return res.status(400).json({ error: "Failed to create user account" });
        }

        // Insert into profiles table
        const { error: profileError } = await (dbSupabase || publicSupabase)
          .from("profiles")
          .insert({ id: data.user.id, email: data.user.email, username });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          return res.status(500).json({ error: profileError.message });
        }

        return res.json({
          session: data.session,
          user: data.user,
          username,
          token: data.session?.access_token || `dev-token-${username}`,
        });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }

    // Fallback Dev Signup
    if (fallbackUsers.has(username)) {
      return res.status(400).json({ error: "That username is already taken — try another." });
    }

    fallbackUsers.set(username, {
      id: `user-${username}`,
      email,
      username,
      passwordHash: password,
    });

    const devToken = `dev-token-${username}`;

    return res.json({
      session: { access_token: devToken },
      user: { id: `user-${username}`, email },
      username,
      token: devToken,
    });
  });

  // Get Profiles / Users
  app.get("/api/profiles", async (req, res) => {
    if (dbSupabase) {
      try {
        const { data, error } = await dbSupabase
          .from("profiles")
          .select("id, username, email, created_at")
          .limit(50);

        if (!error && data) {
          return res.json(data);
        }
      } catch (err) {
        console.error("Error fetching profiles:", err);
      }
    }

    const devProfiles = Array.from(fallbackUsers.values()).map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
    }));
    return res.json(devProfiles);
  });

  // ─────────────────────────────────────────────────────────────
  // VITE / STATIC SERVING
  // ─────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server + WebSocket running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
