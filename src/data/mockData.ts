import { ArchitectureLayer, DesignIdea, Contact, AppNotification, UniversityMatchProfile } from "@/src/types";

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    number: 1,
    name: "The Persistent WebSocket Listener",
    badge: "Layer 01 • Event Mechanics",
    summary: "A pure listening server that accepts full-duplex TCP connections without closing after each response.",
    technicalPrinciple: "Unlike stateless HTTP request-response cycles, a WebSocket maintains a long-lived bidirectional pipe. The server transitions into an asynchronous event emitter reacting to on('connection'), on('message'), and on('close') handlers.",
    realWorldProblem: "HTTP polling causes excessive network overhead, latency spikes, and battery drain for chat apps. Clients need immediate server-push capability.",
    solutionDetail: "Built a lean WebSocket server that establishes persistent socket handles, monitoring heartbeats and ping/pong keep-alives with sub-millisecond response.",
    diagramCode: `// Layer 1: Persistent Event Loop
wss.on('connection', (ws) => {
  console.log('[+] Client connected');
  ws.on('message', (raw) => console.log('Packet:', raw));
  ws.on('close', () => console.log('[-] Disconnected'));
});`
  },
  {
    number: 2,
    name: "In-Memory Client Lookup & Direct Routing",
    badge: "Layer 02 • Routing Table",
    summary: "Maintaining an active client map linking verified identities to live socket connections.",
    technicalPrinciple: "The server maintains an in-memory hash map `Map<UserId, WebSocket>`. When message payload arrives with target recipient 'Sirjan', the server performs an O(1) lookup and pushes the frame directly down Sirjan's open socket.",
    realWorldProblem: "Without a connection table, the server cannot know which open socket descriptor belongs to which student.",
    solutionDetail: "Implemented a memory-efficient connection registry with instant lookup, connection collision handling, and clean garbage collection on socket disconnects.",
    diagramCode: `// Layer 2: Client Connection Registry
const clients = new Map<string, WebSocket>();

function routeDirect(sender: string, targetId: string, msg: string) {
  const targetSocket = clients.get(targetId);
  if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
    targetSocket.send(JSON.stringify({ from: sender, text: msg }));
  }
}`
  },
  {
    number: 3,
    name: "Write-Before-Send Persistence & Offline Catchup",
    badge: "Layer 03 • Database Sync",
    summary: "Guaranteed message durability by committing records to Postgres before attempting live socket push.",
    technicalPrinciple: "Strict write-ahead pattern: A message is inserted into the Postgres `messages` table first. Only after the DB write succeeds is delivery attempted. When offline users reconnect, unread messages are delivered immediately from history query.",
    realWorldProblem: "If network drops or recipient is offline during push, transient in-memory messages disappear forever.",
    solutionDetail: "Integrated Postgres/Supabase storage with indexed query execution. Reconnecting clients request missed messages since last verified sequence timestamp.",
    diagramCode: `// Layer 3: Persistence Guard
async function handleInbound(msgPayload) {
  // 1. Durably persist to database FIRST
  const { data: savedMsg } = await supabase
    .from('messages')
    .insert([msgPayload])
    .select().single();

  // 2. Attempt real-time socket dispatch
  routeDirect(msgPayload.sender, msgPayload.receiver, savedMsg);
}`
  },
  {
    number: 4,
    name: "Stateless JWT Authentication & Security",
    badge: "Layer 04 • Verified Identity",
    summary: "Cryptographic token verification ensuring clients cannot spoof identities or masquerade as other students.",
    technicalPrinciple: "Zero-trust client handshake: Users authenticate with salted Argon2/Bcrypt hashed credentials, receiving a signed JWT. On WebSocket upgrade, the token signature is validated cryptographically before binding socket to userId.",
    realWorldProblem: "Plaintext names in terminal clients allowed any user to claim 'Admin' or spoof other students' handles.",
    solutionDetail: "Token-bound handshake: Every WebSocket connection upgrade requires Bearer JWT validation against Supabase Auth public key. Stateless verification requires zero DB queries on each chat frame.",
    diagramCode: `// Layer 4: Cryptographic Token Upgrade
server.on('upgrade', async (req, socket, head) => {
  const token = extractJwt(req);
  const user = await verifySignedToken(token);
  if (!user) return socket.destroy();
  wss.handleUpgrade(req, socket, head, (ws) => {
    clients.set(user.id, ws);
  });
});`
  },
  {
    number: 5,
    name: "Relational Profile Links, University Matching & RLS Hardening",
    badge: "Layer 05 • Matching & Hardened RLS",
    summary: "Linked student profiles, interest-tag vector matching, and Row Level Security policy debugging.",
    technicalPrinciple: "Separating core auth identity from university profiles (majors, courses, research interests). Applied tightened Row-Level-Security (RLS) policies allowing users to read and write only permitted records.",
    realWorldProblem: "RLS silently blocked message storage because no policies existed. Also, newly signed-up clients carried authenticated state that broke anonymous-only profile creation policies.",
    solutionDetail: "Configured dual-tier RLS policies for auth/anon states. Built interest matching scoring algorithm calculating Jaccard similarity across course codes and research tags.",
    diagramCode: `// Layer 5: RLS Policy Definition
CREATE POLICY "Users can only read messages they participate in"
ON messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create own profile upon signup"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);`
  }
];

export const INITIAL_DESIGN_IDEAS: DesignIdea[] = [
  {
    id: "idea-1",
    title: "Vector-Based Interest & Course Matrix Matching",
    category: "matching-algorithm",
    description: "Instead of raw tag equality, compute cosine similarity between students' semester schedules, favorite library spots, and project ambitions to suggest 3 high-affinity peers every Monday.",
    author: "Sirjan Budhathoki",
    university: "Tribhuvan University",
    tags: ["Algorithm", "Cosine Similarity", "University Graph"],
    upvotes: 42,
    hasUpvoted: true,
    createdAt: "2 days ago",
    status: "in-progress"
  },
  {
    id: "idea-2",
    title: "Terminal TUI / CLI Companion for Engineering Labs",
    category: "mobile-terminal",
    description: "A lightweight terminal UI client (`sajilo-cli`) built in Rust or Go using raw WebSocket stream, allowing CS students to chat directly from their Neovim/tmux workstation.",
    author: "Akhil Bhandari",
    university: "Kathmandu University",
    tags: ["CLI", "TUI", "Rust", "WebSocket"],
    upvotes: 38,
    hasUpvoted: false,
    createdAt: "3 days ago",
    status: "planned"
  },
  {
    id: "idea-3",
    title: "Dithered 1-Bit Retro Scanline Theme with Window Glitch",
    category: "ui-ux",
    description: "Expand the PROJECT.EXE Michelangelo aesthetic into dynamic window snapping, retro status bars, and pixel-perfect phosphor CRT screen mode.",
    author: "Priya Gurung",
    university: "Pulchowk Campus",
    tags: ["Dither", "Retro OS", "Pixel Art", "UI"],
    upvotes: 56,
    hasUpvoted: true,
    createdAt: "1 day ago",
    status: "completed"
  },
  {
    id: "idea-4",
    title: "Encrypted Ephemeral Study Rooms with Auto-Destruct",
    category: "security-rls",
    description: "Temporary chat channels for exam cram sessions that securely purge all message history from Postgres once all active participants disconnect.",
    author: "Rohan Thapa",
    university: "Apex College",
    tags: ["Privacy", "Postgres", "Auto-Purge"],
    upvotes: 27,
    hasUpvoted: false,
    createdAt: "4 days ago",
    status: "under-review"
  },
  {
    id: "idea-5",
    title: "WebSocket Connection State Visualizer in Status Bar",
    category: "websocket-engine",
    description: "Add a live telemetry HUD showing real-time ping (ms), packet drop rate, active socket handshake status, and frame byte counters.",
    author: "Aayush Shrestha",
    university: "Softwarica College",
    tags: ["Telemetry", "WebSocket", "Latency HUD"],
    upvotes: 31,
    hasUpvoted: false,
    createdAt: "Just now",
    status: "in-progress"
  }
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: "user-akhil",
    name: "Akhil Bhandari",
    handle: "@akhil_b",
    status: "online",
    lastSeen: "Active now",
    lastMessage: "The WebSocket routing table handles 10k connections seamlessly!",
    lastMessageTime: "2m",
    unreadCount: 1,
    sharedInterests: ["Distributed Systems", "Rust", "Computer Architecture", "Rock Climbing"],
    university: "Kathmandu University",
    major: "Computer Engineering (B.E.)"
  },
  {
    id: "user-sirjan",
    name: "Sirjan Budhathoki",
    handle: "@sirjan_b",
    status: "online",
    lastSeen: "Active now",
    lastMessage: "Would you like more details on this product design?",
    lastMessageTime: "20h",
    unreadCount: 0,
    sharedInterests: ["UI/UX Engineering", "Design Systems", "Typescript", "Indie Music"],
    university: "Tribhuvan University",
    major: "BSc. CSIT"
  },
  {
    id: "user-priya",
    name: "Priya Gurung",
    handle: "@priya_g",
    status: "away",
    lastSeen: "15m ago",
    lastMessage: "Can you review the database migration PR for RLS?",
    lastMessageTime: "5h",
    unreadCount: 2,
    sharedInterests: ["PostgreSQL", "Database Internals", "Machine Learning", "Photography"],
    university: "Pulchowk Campus, IOE",
    major: "Electronics & Info Engineering"
  },
  {
    id: "user-rohan",
    name: "Rohan Thapa",
    handle: "@rohan_t",
    status: "offline",
    lastSeen: "2d ago",
    lastMessage: "Let's connect at the Hackathon meetup this Friday.",
    lastMessageTime: "1d",
    unreadCount: 0,
    sharedInterests: ["Full-Stack Dev", "Cybersecurity", "Blockchain", "Chess"],
    university: "Apex College",
    major: "Software Engineering"
  },
  {
    id: "user-aayush",
    name: "Aayush Shrestha",
    handle: "@aayush_s",
    status: "online",
    lastSeen: "Active now",
    lastMessage: "The RLS policy fixes solved the profile creation bug completely.",
    lastMessageTime: "3d",
    unreadCount: 0,
    sharedInterests: ["Backend Architecture", "Go", "Docker", "Astronomy"],
    university: "Softwarica College",
    major: "Computing & IT"
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    type: "friend_request",
    userName: "Akhil Bhandari",
    actionText: "sent you a friend request.",
    timeAgo: "10 mins ago",
    status: "pending"
  },
  {
    id: "notif-2",
    type: "like",
    userName: "Sirjan Budhathoki",
    actionText: "liked your message:",
    messagePreview: "That sounds like a great plan!",
    timeAgo: "2 hours ago"
  },
  {
    id: "notif-3",
    type: "mention",
    userName: "Priya Gurung",
    actionText: "mentioned you in a group:",
    messagePreview: "Can you check the latest designs?",
    timeAgo: "5 hours ago"
  },
  {
    id: "notif-4",
    type: "friend_request",
    userName: "Rohan Thapa",
    actionText: "sent you a friend request.",
    timeAgo: "1 day ago",
    status: "pending"
  },
  {
    id: "notif-5",
    type: "security",
    userName: "System Security",
    actionText: "detected a new login from Chrome on Windows (Stateless JWT Verified).",
    timeAgo: "2 days ago"
  },
  {
    id: "notif-6",
    type: "match_found",
    userName: "Interest Engine",
    actionText: "Found 98% affinity match with Kriti Sharma (Distributed Systems & AI).",
    timeAgo: "3 days ago"
  }
];

export const UNIVERSITY_MATCH_PROFILES: UniversityMatchProfile[] = [
  {
    id: "match-1",
    name: "Kriti Sharma",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    university: "Tribhuvan University",
    major: "Computer Engineering (Final Year)",
    year: "Senior",
    bio: "Working on real-time stream processing and high-throughput microservices. Looking for collaborators on distributed cache research.",
    matchScore: 98,
    interests: ["Distributed Systems", "Go", "WebSockets", "Kafka", "Postgres"],
    seeking: "Research Partner & Hackathon Team"
  },
  {
    id: "match-2",
    name: "Samir Gautam",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    university: "Kathmandu University",
    major: "Data Science & AI",
    year: "Junior",
    bio: "Passionate about graph neural networks and matching algorithms. Building recommendation engines for student communities.",
    matchScore: 94,
    interests: ["Machine Learning", "Graph Neural Networks", "Python", "Algorithms", "Tennis"],
    seeking: "Study Group & Project Collaborator"
  },
  {
    id: "match-3",
    name: "Sneha Neupane",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    university: "Pulchowk Campus",
    major: "Computer Engineering",
    year: "Sophomore",
    bio: "Exploring frontend architectures, WebGL, shaders, and retro design systems. Loving low-latency UI feedback.",
    matchScore: 89,
    interests: ["React", "WebGL", "Dither Shaders", "UI/UX", "Rock Music"],
    seeking: "Frontend Dev Buddy"
  }
];
