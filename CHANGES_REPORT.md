# Security & Architecture Audit: Changes and Fixes Report

This document outlines all vulnerabilities, bugs, structural issues identified in the codebase, the exact files and lines modified, and the rationale behind each change.

---

## 1. Executive Summary of Changes

| Area | Issue / Vulnerability | Severity / Impact | Fix Applied |
| :--- | :--- | :--- | :--- |
| **Auth & Profiles** | Client-side insert into `profiles` after `signUp()` fails silently when Email Confirmation is enabled (no session returned, anonymous request blocked by RLS). | **High / Critical** | Moved profile creation to a server-side PostgreSQL database trigger (`handle_new_user`) on `auth.users`. Updated `signUp()` calls to pass `full_name` and `username` in `options.data`. |
| **Database Schema** | Missing `full_name` column in `profiles` and column mismatch across app queries causing dashboard lockout errors. | **Medium / High** | Added SQL migration for `full_name`, updated all frontend and backend queries to safely query `id, username, full_name, email`. |
| **Profile Management** | `ProfileView.jsx` simulated saving with `setTimeout` without persisting to Supabase, and lacked full name management. | **Medium** | Built real Supabase update calls for `full_name`, bio, and university with loading, error, and success states. |
| **Directory Search** | Directory only displayed username and did not allow searching by student full names. | **Low / Medium** | Added `full_name` support in search filtering and updated card displays to render full names and handles. |
| **WebSocket Server** | Unvalidated token payloads, missing message body validation, and multi-tab disconnect race condition. | **Medium / High** | Added strict token type validation, message length limits (4000 chars), recipient sanitization, and verified socket identity on disconnect. |
| **Messages Synchronization** | Username casing differences (`toLowerCase()`) and missing Supabase historical messages caused conversations to fail to match or show. | **High** | Implemented case-insensitive message filtering, Map-based deduplication, sorted timestamp merging, and `ilike` query support. |
| **Real-Time Postgres Streaming** | Messages inserted directly into Supabase or received while unselected weren't dynamically active. | **High** | Added Supabase `postgres_changes` table listener, periodic 5s background sync, multi-column fallback resolver, and auto-selection of the latest active thread. |
| **Duplicate Message in UI** | Sending a message created an optimistic UI entry with no database ID. Subsequent database inserts and `postgres_changes` listener appended the database row with `id` alongside the temporary message, displaying two bubbles. | **High** | Implemented in-place ID upgrade on temporary messages, temporary message reconciliation during `loadMessageHistory`, and added `skipDb: true` over WebSocket to eliminate duplicate server inserts. |
| **Notification Rules & Throttling** | Notifications were being backfilled from historical messages while offline, and multiple notifications from the same sender accumulated. | **Medium / High** | Removed offline notification generation on login/history load. Enforced real-time only notifications and throttled to exactly one notification per sender (replacing previous alerts from the same person). |
| **Islington Email Barrier** | Unrestricted registration allowed non-student emails to access the campus network. | **High** | Restricted signup strictly to `@islingtoncollege.edu.np` emails with live UI badges and error blocking. |
| **Profile & Bio Controls** | University affiliation was unverified and bio lacked character limit controls. | **Medium** | Auto-verified university affiliation to Islington College Kathmandu, initialized empty bios with strict 60-character limits, and synchronized with Supabase user metadata. |
| **CLI Login Script** | `login.js` lacked `full_name` collection and failed when email verification was enabled. | **Low / Medium** | Added `fullName` CLI prompt, passed data in `signUp()` user metadata, and handled email verification feedback. |
| **Dev Server Boot** | Root `package.json` had no `dev`/`build` scripts, and Vite did not bind to `0.0.0.0:3000`. | **High (Dev Blocker)** | Added proxy scripts to root `package.json` and configured Vite host & port. |
| **Friend System & Direct Messaging** | Users could message any student without prior authorization; missing friend requests table and bidirectional permission checks. | **High** | Built a complete Friend Request system (`friend_requests` table, `pending` / `accepted` states, decline deletion), relationship-aware Directory actions, notifications feed, and server-side WebSocket messaging authorization. |
| **Extended Profiles & Verified College** | Profile lacked fields for gender, section, and faculty; college affiliation was not tied to the student's institutional email domain. | **Medium** | Added `gender` (options dropdown), `section`, `faculty`, and 60-char `bio` limits. College affiliation is strictly derived from verified email domain (`@islingtoncollege.edu.np`) and rendered read-only. |

---

## 2. Supabase SQL Database Migration

Execute this SQL migration in your **Supabase Dashboard -> SQL Editor** to establish the server-side triggers, profile schema extensions, and the friend request table with Row Level Security:

```sql
-- 1. Extend profiles table with college, faculty, section, gender, and bio
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS college TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS faculty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Create the friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_friend_request_pair UNIQUE(requester_id, addressee_id),
  CONSTRAINT no_self_friend_request CHECK (requester_id <> addressee_id)
);

-- Index for bidirectional relationship lookups
CREATE INDEX IF NOT EXISTS idx_friend_requests_lookup
  ON public.friend_requests (requester_id, addressee_id, status);

-- 3. Row Level Security for friend_requests
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own friend requests" ON public.friend_requests;
CREATE POLICY "Users can view their own friend requests"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Addressees can update friend requests" ON public.friend_requests;
CREATE POLICY "Addressees can update friend requests"
  ON public.friend_requests FOR UPDATE
  USING (auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Participants can delete friend requests" ON public.friend_requests;
CREATE POLICY "Participants can delete friend requests"
  ON public.friend_requests FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 4. Server-side trigger function on auth.users (automatically assigns verified college from email domain)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  derived_college TEXT;
  clean_email TEXT;
BEGIN
  clean_email := LOWER(TRIM(NEW.email));

  IF clean_email LIKE '%@islingtoncollege.edu.np' THEN
    derived_college := 'Islington College Kathmandu';
  ELSIF clean_email LIKE '%@heraldcollege.edu.np' THEN
    derived_college := 'Herald College Kathmandu';
  ELSIF clean_email LIKE '%@softwarica.edu.np' THEN
    derived_college := 'Softwarica College Kathmandu';
  ELSE
    derived_college := 'Islington College Kathmandu';
  END IF;

  INSERT INTO public.profiles (id, email, username, full_name, college)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
    derived_college
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    username = COALESCE(EXCLUDED.username, public.profiles.username),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    college = COALESCE(EXCLUDED.college, public.profiles.college);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Profile RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

## 3. Detailed Breakdown of Codebase Changes

### A. `frontend/src/components/AuthModal.jsx`
* **Lines Modified**: 75–120
* **Why it was changed**:
  1. Previously, `AuthModal.jsx` attempted to run `supabase.from('profiles').insert(...)` directly from the client immediately following `supabase.auth.signUp()`.
  2. When Supabase "Confirm Email" is active, `signUp()` registers the user in `auth.users` but does **not** issue a JWT access token until the confirmation link is clicked. Consequently, the client-side profile insert was executed as an anonymous request (`anon` role), which was blocked by Row Level Security (RLS) policies (`auth.uid() = id`).
  3. The error was caught silently by `console.warn`, causing new users to confirm their email only to find that their profile row was never created, locking them out of the chat.
* **What was changed**:
  1. Updated `signUp()` to pass `full_name` and `username` inside `options.data` so the Postgres database trigger can extract them and automatically insert the profile row on the server.
  2. Guarded the client-side profile sync so it only executes as a fallback if an active session is already present (`authData.session`).
  3. Added informative feedback explaining that a confirmation email has been dispatched when `!authData.session`.

---

### B. `frontend/src/components/ProfileView.jsx`
* **Lines Modified**: Full component overhaul (Lines 1–130)
* **Why it was changed**:
  1. The existing profile view only contained a mock `setTimeout` on the "Save Profile" button without actually writing changes to Supabase.
  2. There was no UI input for managing `full_name`.
  3. ESLint reported lifecycle synchronization errors with state updates in effects.
* **What was changed**:
  1. Added a **Full Name** input field with icons (`User`), clear helper descriptions, and updated initials calculation based on first and last name.
  2. Implemented real Supabase persistence:
     ```javascript
     const { error } = await supabase
       .from('profiles')
       .update({ full_name: fullName.trim() })
       .eq('id', currentUserId);
     ```
  3. Added state indicators for `saving`, `saved`, and `errorMsg`.
  4. Triggered `onProfileUpdate` to synchronize updated profile state up to `App.jsx` without requiring a page refresh.

---

### C. `frontend/src/App.jsx`
* **Lines Modified**: 21–48, 125–135
* **Why it was changed**:
  1. `fetchProfile()` previously queried only `select('username')`, leaving `full_name` undefined across the app.
  2. If a user updated their profile in `ProfileView`, `App.jsx` did not receive the updated profile state.
* **What was changed**:
  1. Updated query to `.select('id, username, full_name, email')`.
  2. Passed `onProfileUpdate={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}` into `ProfileView`.
  3. Initialized fallback profiles with complete schema fields (`id`, `username`, `email`, `full_name`).

---

### D. `frontend/src/components/DirectoryView.jsx`
* **Lines Modified**: 10–50, 90–105
* **Why it was changed**:
  1. Directory queries only fetched `id, username, email`.
  2. Directory cards only displayed `@username` without the student's real name.
  3. Search filtering did not match against `full_name`.
* **What was changed**:
  1. Updated query to `.select('id, username, full_name, email')`.
  2. Enhanced search filter: `s.full_name?.toLowerCase().includes(q)`.
  3. Updated directory cards to display `student.full_name` as the main title and `@student.username` as the subtitle.

---

### E. `server.js` (WebSocket Gateway)
* **Lines Modified**: 20–115
* **Why it was changed**:
  1. Token parsing lacked type checks (could throw unhandled exceptions on malformed payloads).
  2. Profile query only fetched `username`.
  3. Unsanitized PostgREST filter interpolation: `.or(\`sender_username.eq.${socket.name}...\`)` could fail on usernames with non-alphanumeric characters.
  4. Message handler did not validate message length or empty payloads, leaving room for spam or malformed broadcasts.
  5. Multi-tab race condition: when a user opened multiple tabs and closed one, the `close` handler deleted `clients.get(socket.name)` unconditionally, severing message delivery to the remaining open tab.
* **What was changed**:
  1. Added token type checks and returned structured error envelopes (`{ type: 'auth_error' }`).
  2. Selected `id, username, full_name` and returned `full_name` in `auth_success`.
  3. Sanitized username tokens before injecting into PostgREST filter strings and added a `.limit(100)` query cap.
  4. Enforced message payload validation: recipient existence, non-empty content, and max length limit (4,000 chars).
  5. Fixed disconnect race condition by verifying socket reference equality:
     ```javascript
     if (socket.name && clients.get(socket.name) === socket) {
       clients.delete(socket.name);
     }
     ```

---

### F. `login.js` (CLI Auth Utility)
* **Lines Modified**: 25–70
* **Why it was changed**:
  1. First-time registration through the CLI tool did not prompt for the user's full name.
  2. It relied on a client-side insert that failed if email verification was enabled.
* **What was changed**:
  1. Added `ask('Enter your full name: ')`.
  2. Passed `full_name` and `username` in `supabase.auth.signUp({ options: { data: ... } })`.
  3. Used `upsert` with fallback handling for cases where the database trigger already populated the profile row.

---

### G. Dev Server & Build System Configuration
* **Files Modified**: `/package.json`, `/frontend/package.json`, `/frontend/vite.config.js`, `/frontend/src/lib/supabaseClient.js`, `metadata.json`, `.env.example`
* **Why it was changed**:
  1. Root `package.json` had no `dev` or `build` scripts, causing container startup to fail.
  2. Vite dev server default host was `localhost`, which was inaccessible in container environments requiring host `0.0.0.0` and port `3000`.
  3. `supabaseClient.js` lacked fallback values when environment variables were not yet configured, throwing runtime initialization exceptions.
* **What was changed**:
  1. Added root proxy scripts: `"dev": "npm --prefix frontend run dev"`, `"build": "npm --prefix frontend run build"`, and `"lint": "npm --prefix frontend run lint"`.
  2. Configured Vite server and preview to bind to `0.0.0.0:3000`.
  3. Provided safe fallback defaults in `supabaseClient.js`.
  4. Created `.env.example` and `metadata.json`.

---

### H. Messages Feed & Case-Insensitive Matching
* **Files Modified**: `/frontend/src/components/MessagesView.jsx`, `/frontend/src/context/WebSocketContext.jsx`, `/server.js`
* **Why it was changed**:
  1. Historical messages queried from Supabase failed to match when usernames had differing letter cases between registration, session, and message records (e.g. `akhil616` vs `Akhil616`).
  2. The sidebar conversation partner extractor used strict `===` against `currentUsername`, causing users to see themselves in their own chat list or missing existing conversations.
  3. When new messages arrived while older history was loaded, array overwrites could drop recent messages.
* **What was changed**:
  1. Applied normalized `toLowerCase().trim()` comparisons across `MessagesView.jsx` for `currentConversation` filtering, sidebar preview lookups, and peer list generation.
  2. Updated Supabase SQL queries to use case-insensitive matching (`sender_username.ilike.${username},receiver_username.ilike.${username}`).
  3. Implemented Map-based message deduplication in `WebSocketContext.jsx` that merges Supabase historical records, WebSocket history, and live incoming socket messages in sorted timestamp order without duplicates.

---

### I. Offline Notification Mechanism & Presence Sync
* **Files Modified**: `/frontend/src/components/NotificationsView.jsx`, `/frontend/src/context/WebSocketContext.jsx`, `/server.js`
* **Why it was changed**:
  1. When a user was offline and received messages from peers, no unread alerts were queued or presented upon logging back in.
  2. When notifications were dismissed, there was no persistent tracking, causing them to re-appear on page refresh.
* **What was changed**:
  1. In `server.js`, on client authentication (`type: 'auth'`), the server queries past messages and dispatches an `offline_notifications` payload with all incoming peer messages.
  2. In `WebSocketContext.jsx`, offline messages are filtered against a persistent `localStorage` dismissed set (`cj_viewed_notifs_<username>`).
  3. Incoming live WebSocket messages and Supabase Realtime broadcast messages now automatically append to notifications if sent from a peer.
  4. In `NotificationsView.jsx`, added "Mark as Read" (single item dismissal) and "Mark All as Read", as well as "Open Chat" which marks the alert as viewed and directs the student straight into the conversation.

---

### J. Islington College Domain Restriction & Student Identity
* **Files Modified**: `/frontend/src/components/AuthModal.jsx`, `/frontend/src/components/ProfileView.jsx`, `/frontend/src/components/DirectoryView.jsx`, `/frontend/src/App.jsx`
* **Why it was changed**:
  1. Open registration allowed any generic consumer email (`@gmail.com`, `@outlook.com`) to sign up, violating the closed Islington College campus network requirements.
  2. Profiles did not enforce university affiliation or letter constraints on academic bios.
* **What was changed**:
  1. Added a strict verification barrier in `AuthModal.jsx`: registration is rejected unless the email ends with `@islingtoncollege.edu.np`.
  2. Configured auto-verified affiliation to `Islington College Kathmandu` across profiles, directory tags, and user metadata.
  3. Enforced a strict 60-character limit on the student bio field with live character counters, persisting updates directly to Supabase Auth user metadata and database profile records.

---

### K. Real-Time PostgreSQL Changes, Dynamic Thread Ordering & Multi-Tier Resolution
* **Files Modified**: `/frontend/src/context/WebSocketContext.jsx`, `/frontend/src/components/MessagesView.jsx`, `/server.js`
* **Why it was changed**:
  1. Messages inserted directly through the Supabase Dashboard, SQL migrations, or external scripts were not pushed live to open client sessions without WebSocket activity.
  2. The Messages view auto-selected the first peer alphabetically or from directory listings rather than opening the conversation with the student who sent the latest messages.
  3. Divergence in column naming conventions (`sender` vs `sender_username` vs `from`) could lead to missing messages in strict queries.
* **What was changed**:
  1. Subscribed the frontend to Supabase Realtime `postgres_changes` on the `messages` table with `INSERT` event handlers to instantly capture and format incoming rows.
  2. Implemented a 5-second resilient background sync in `WebSocketContext.jsx` to ensure uninterrupted history fetching across reconnects.
  3. Added multi-tier query fallback that inspects both specific `.or()` clauses and full table scans with client-side attribute resolution (`sender_username`, `sender`, `from`, `receiver_username`, `receiver`, `to`).
  4. Updated `MessagesView.jsx` to sort peer conversation lists by the timestamp of the latest message and auto-select the conversation containing recent activity.

---

### L. Fix for Database Persistence, Double Message Rendering & Single Notification per Person
* **Files Modified**: `/frontend/src/context/WebSocketContext.jsx`, `/server.js`, `/frontend/src/components/NotificationsView.jsx`
* **Where the Problem Was & Why It Happened**:
  1. **Message Persistence Failure & Double Rendering**:
     - *Location*: `server.js` (`message` event handler) and `WebSocketContext.jsx` (`sendMessage`, `postgres_changes`, and `loadMessageHistory`).
     - *Cause*: Client-side anon inserts to Supabase were failing or blocked by RLS policies if the user's session token didn't have write permissions to the `messages` table. When the server was skipped (`skipDb: true`), messages were only stored in React local state and lost upon refresh. Furthermore, optimistic messages sent to state had temporary IDs, and when database rows arrived with real database IDs, key matching created duplicate bubbles in the UI.
  2. **Unsolicited Offline Notifications & Multiple Alerts**:
     - *Location*: `server.js` (`auth` handler), `WebSocketContext.jsx` (`loadMessageHistory()`).
     - *Cause*: Historical messages were previously being backfilled as notifications upon login/refresh, and multiple alerts from the same sender accumulated instead of updating in-place.
* **What Was Changed to Fix It**:
  1. **Guaranteed Server-Side Database Persistence**:
     - Updated `server.js` to unconditionally persist every sent message to Supabase using the trusted service client in `db.js`, which bypasses RLS safely and guarantees persistent storage across page refreshes.
     - `server.js` returns an explicit `message_ack` event containing the official database `id` and `created_at` timestamp.
  2. **Unified Message Merger (`mergeMessageList`)**:
     - Created `mergeMessageList()`, a single deterministic function that safely merges incoming messages from all streams (optimistic state, server acks, WebSocket routing, `postgres_changes`, and historical queries).
     - Upgrades temporary optimistic messages to official database records in-place without ever duplicating the message in the UI.
     - Preserves all chat history upon page refresh and background sync.
  3. **Notification Rules & Throttling**:
     - Eliminated offline notification backfilling upon login.
     - Enforced that exactly one notification exists per person at any given time (`pushNotification`), replacing older alerts from the same contact with the most recent notification.

---

### M. Extended Student Profiles & Read-Only Institutional College Affiliation
* **Files Modified**: `/frontend/src/components/ProfileView.jsx`, `/frontend/src/lib/collegeUtils.js`, `/frontend/src/components/AuthModal.jsx`, `/frontend/src/App.jsx`, `/login.js`
* **Why it was changed**:
  1. Students needed the ability to specify their `gender`, academic `section`, and `faculty` alongside their full name and bio.
  2. Institutional affiliation (`college`) was previously a generic text string that could be modified arbitrarily or defaulted improperly.
* **What was changed**:
  1. Built `frontend/src/lib/collegeUtils.js` which automatically derives the college affiliation from the student's verified email domain (`@islingtoncollege.edu.np` → *Islington College Kathmandu*, `@heraldcollege.edu.np` → *Herald College Kathmandu*, `@softwarica.edu.np` → *Softwarica College Kathmandu*).
  2. Enforced that the College Affiliation field in `ProfileView.jsx` is strictly **read-only** with a visual padlock icon, preventing spoofed affiliations.
  3. Added interactive profile controls for:
     - **Gender**: Fixed dropdown selection (`Male`, `Female`, `Other`, `Prefer not to say`).
     - **Section**: Academic class identifier (e.g. `Section A`, `L5C1`).
     - **Faculty**: Program of study (e.g. `BSc (Hons) Computing`).
     - **Academic Bio**: Limited to a maximum of 60 characters with a live character counter.
  4. Updated registration handlers (`AuthModal.jsx` and `login.js`) and database triggers to set `college` on account creation.

---

### N. End-to-End Friend Request System & Messaging Authorization
* **Files Modified**: `/frontend/src/context/WebSocketContext.jsx`, `/frontend/src/components/DirectoryView.jsx`, `/frontend/src/components/NotificationsView.jsx`, `/frontend/src/components/Sidebar.jsx`, `/server.js`, `supabase_migration.sql`
* **Why it was changed**:
  1. Previously, any registered user could send messages directly to any other student without mutual consent.
  2. There was no database-backed relationship tracking, no friend request lifecycle, and no UI for reviewing or accepting invitations.
* **What was changed**:
  1. **Database Schema (`friend_requests`)**:
     - Columns: `id` (UUID), `requester_id` (UUID), `addressee_id` (UUID), `status` (`pending` or `accepted`), `created_at`, `updated_at`.
     - Constraints: `UNIQUE(requester_id, addressee_id)` to prevent duplicate requests and `CHECK (requester_id <> addressee_id)` to prevent self-requests.
     - Row Level Security (RLS) policies allowing users to view their own requests, insert as requester, update as addressee, and delete when declining.
  2. **Bidirectional Relationship Resolution**:
     - `getRelationshipWithUser(target)` evaluates both directions (`requester = me AND addressee = target` OR `requester = target AND addressee = me`) to return one of four states:
       - `none`: No relationship exists.
       - `sent`: Current user sent a request (pending).
       - `received`: Target user sent a request to the current user (pending).
       - `accepted`: Mutual friends.
  3. **Context-Aware Directory Actions**:
     - `none` → Shows an active **Add Friend** button.
     - `sent` → Shows a disabled **Request Sent** indicator.
     - `received` → Shows an active **Accept Request** button.
     - `accepted` → Shows a direct **Message** button opening chat.
  4. **Notifications Center Integration**:
     - Displays incoming friend requests with the requester's name, handle, and faculty.
     - Provides instant **Accept** (updates status to `accepted`) and **Decline** (deletes row to allow future re-requests) actions.
     - Real-time notification counters dynamically reflect the sum of pending friend requests and unread direct messages.
  5. **Server-Side Security Enforcement in `server.js`**:
     - Before relaying or saving any direct message payload, `checkFriendship()` inspects the `friend_requests` table bidirectionally to ensure an `accepted` status exists.
     - Unauthorized message transmissions are blocked and rejected with an error notice (`"You are not friends with this user"`).

---

## 4. How the Friend Request Mechanism Works (Simple Explanation)

The friend system ensures privacy by requiring mutual consent before two students can start messaging each other. Here is how it operates from start to finish:

```
[ Student A ]                                                       [ Student B ]
     |                                                                   |
     |--- 1. Clicks "Add Friend" in Directory -------------------------->|
     |    (Creates row in `friend_requests` with status: 'pending')      |
     |                                                                   |
     |    [ Directory Button: "Request Sent" (Disabled) ]                |
     |                                                                   |
     |                                                                   |--- 2. Sees Badge & Notification in Notifications Tab
     |                                                                   |    [ Card: "Student A sent you a friend request" ]
     |                                                                   |
     |                                                                   |--- 3A. If B clicks "Decline":
     |                                                                   |    - Row is completely deleted from the database.
     |                                                                   |    - Both students reset to "Add Friend".
     |                                                                   |
     |                                                                   |--- 3B. If B clicks "Accept":
     |                                                                   |    - Status updates from 'pending' to 'accepted'.
     |<------------------------------------------------------------------|
     |                                                                   |
     |=== 4. Both students are now officially Friends ===================|
     |                                                                   |
     |--- Button in Directory turns into "Message" for both students --->|
     |--- Both can now send direct messages via WebSocket & Supabase --->|
     |--- Server validates friendship before routing each message ------>|
```

### Step-by-Step Breakdown:

1. **Sending a Request (`A → B`)**:
   - Student A opens the **Student Directory** and clicks **Add Friend** on Student B's card.
   - ConnectJutti creates a new record in the `friend_requests` table with `requester_id = A`, `addressee_id = B`, and `status = 'pending'`.
   - Student A's button immediately updates to a disabled **Request Sent** button.

2. **Receiving & Reviewing the Request (`B's View`)**:
   - Student B sees an updated notification badge on their sidebar (e.g. `1 NEW`).
   - When Student B opens the **Notifications** tab, a dedicated card displays Student A's full name, username handle, faculty, and how long ago the request was sent.
   - If Student B also browses the Directory, Student A's card displays an **Accept Request** button.

3. **Responding to the Request**:
   - **Accepting**: When Student B clicks **Accept**, the database row status is updated to `'accepted'`. Both students are now connected.
   - **Declining**: When Student B clicks **Decline**, the request is deleted from the database. This cleanly removes the alert without leaving stale or blocked states, allowing either student to send a new request in the future if desired.

4. **Chat & Security Authorization**:
   - Once the status is `'accepted'`, the button on both students' Directory cards changes to **Message**, allowing either peer to start a chat thread immediately.
   - In `server.js`, whenever a student sends a direct message over the WebSocket connection, the backend server performs a bidirectional friendship verification query (`checkFriendship`). If two users are not mutual friends with an `'accepted'` status, the message is blocked and an error notification is returned.



