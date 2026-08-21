# Real-Time Chat Backend — Project Overview

This document explains what this project is, how it was built (in the order it was actually built) — from a print-only WebSocket server, through message routing, persistence, authentication, and eventually a structured message protocol — the core concepts behind every decision, and the specific problems that came up along the way and how they were solved. It's written so that someone with no prior background could read it and understand *why* a chat backend is built the way it is — not just *that* it works.

This chat system is being built as the messaging layer for a larger university interest-matching app — the goal there is to match students by shared interests instead of random browsing, and this backend handles the actual conversations between matched users once they're connected.

> **Manual step required (Layer 7):** the project now uses two separate database keys instead of one — the existing public key, and a new, far more privileged **service role** key that only the server should ever hold. This second key has to be copied by hand from the project's dashboard (Settings → API → the "service_role" secret) into the environment file, since it's sensitive enough that it isn't retrieved automatically. It must never be shared with, or embedded in, anything a real client (like a browser) would run.

---

## 1. The Big Picture First

Before writing anything, it helps to understand that every chat application, no matter how complex, is really just three things talking to each other:

- **Client** — the app or interface a person uses (in our case, a terminal acting as a stand-in client for now).
- **Server** — the middleman that receives messages, decides where they go, and talks to the database.
- **Database** — the permanent record of who exists and what's been said.

The part that's easy to misunderstand at first is *how the server knows where to send a message the instant it arrives*. That single question is what shaped almost every decision below.

### Two different ways a client and server talk

- **HTTP (regular web requests)** — the client asks a question, the server answers, and the connection closes. Good for things that aren't urgent: logging in, fetching old messages, fetching a profile.
- **WebSocket** — a connection that stays *open* the whole time the client is active. Once open, the server can push data to the client at any moment without being asked again. This is what makes a chat feel "live," and it's the backbone of this whole project.

The rule followed throughout: **anything that needs to happen instantly (sending/receiving messages) uses a WebSocket. Anything else (logging in, fetching history) can use a normal request.**

---

## 2. The Approach: Building in Layers, Not All at Once

Rather than trying to build authentication, a database, and real-time messaging simultaneously, the project was deliberately built in increasing layers of complexity — each one working fully before the next was added. This is a useful approach for any beginner: get the simplest possible version working, understand it completely, then add one capability at a time.

### Layer 1 — A WebSocket server that does nothing but listen

The very first version of the server didn't route messages anywhere or save anything — it just accepted connections and printed whatever it received straight to the console. The purpose of this step was purely to understand the *shape* of a WebSocket server: how a connection is opened, how the server reacts when data arrives, and how a connection closing is detected. Nothing about chat logic was tackled yet — just the mechanics of a persistent, event-driven connection.

This introduced the core idea that a WebSocket server isn't structured like a typical function that runs once and returns an answer. Instead, it's **event-driven**: the code defines *reactions* to things that happen over time (a new connection arriving, a message arriving, a connection closing), and those reactions can fire at any point, unpredictably, for as long as the server runs.

### Layer 2 — Naming clients and routing messages between them

Once the basic listen-and-print server worked, the next layer added two capabilities: giving each connected client an identity (a name), and allowing one client to send a message that gets routed specifically to *another* connected client — rather than just being logged.

This required the server to keep an in-memory lookup table mapping each client's name to their live connection. This lookup table is the single most important concept in the whole "live delivery" side of a chat system: **whenever the server needs to reach a specific person right now, it looks up their current connection in this table and sends data down it directly.** Without this table, the server would have no way of knowing which open connection belongs to which person.

At this stage, a very simple text-based convention was used so a plain terminal could act as a test client — the first message sent after connecting was treated as the client's chosen name, and later messages followed a "send this text to this specific person" pattern. This was intentionally a temporary shortcut for testing purposes, not a real message format a production client would use.

### Layer 3 — Persistence: connecting the server to a database

Up to this point, every message only existed in memory for as long as both people happened to be connected at the same time. Nothing survived a server restart, and a message sent to someone offline simply vanished. This layer introduced a real database (Supabase, which is a hosted Postgres database with some extra built-in tools) to fix that.

The core principle introduced here: **a message is saved to the database first, before the server even attempts to deliver it live.** This ordering matters — if delivery happened first and storage second, a crash or a failed send in between would silently lose the message. By saving first, the message's existence never depends on whether delivery succeeds.

This also introduced the idea of **fetching history on connect** — when a client connects and identifies themselves, the server now checks the database for anything addressed to them that arrived while they were away, and delivers all of it immediately. This is what makes a chat system feel persistent instead of resetting to blank every time someone reconnects.

### Layer 4 — Authentication: proving identity instead of trusting it

Everything up to this point had a significant gap: a client's "identity" was just whatever name they typed after connecting. Nothing stopped someone from typing any name they wanted, including someone else's. This layer replaced that honor-system approach with real authentication.

A few foundational concepts matter here:

- **Authentication vs. authorization** — these are often confused. Authentication is proving *who you are* (logging in). Authorization is, once you're known, deciding *what you're allowed to do*. This project so far has only tackled authentication.
- **Never handle passwords directly.** Storing a password as plain text is a serious security failure — if the database were ever exposed, every password would be exposed with it. The standard solution is **hashing**: running the password through a one-way mathematical function that scrambles it into something that can't be reversed back into the original. When someone logs in later, their entered password is hashed again and the two hashes are compared — the real password is never stored or directly compared anywhere. Getting every detail of this right by hand (salting, timing-safe comparisons, etc.) is notoriously easy to get subtly wrong, which is why this project deliberately did *not* build password handling from scratch.
- **Tokens (JWTs) instead of server memory.** Rather than having the server keep a list of "who's logged in" in its own memory, this project uses **JWTs (JSON Web Tokens)** — a signed piece of data that proves identity. Once a client logs in, they receive a token. From then on, they present that token instead of typing a name, and the server can verify the token's signature is genuine without needing to look anything up or remember anything itself. This is called being **stateless**, and it fits a WebSocket-based app naturally: the token is presented once, right when the connection opens.
- **Letting Supabase handle the dangerous part.** Rather than writing password hashing and token issuing from scratch, this project uses Supabase's built-in authentication system, which already does this correctly. The server's job became much simpler: take the token a client presents, ask Supabase "is this genuine, and who does it belong to," and trust the answer.

From this point on, a client's identity is only ever accepted if it comes from a verified, signed token — never from something typed directly.

### Layer 5 — Linking authentication to app-specific data

Supabase's authentication system automatically creates and manages its own internal table of accounts (containing things like email and the hashed password) the moment someone signs up. Importantly, **this table did not need to be built by hand** — it's created and secured automatically as part of using the authentication system.

However, that internal table only knows about login credentials — it has no concept of anything specific to this app, like a chosen display name. To bridge that gap, a separate **profile table** was created that is explicitly *linked* to the authentication table via a shared unique identifier. This is a foundational relational-database concept: rather than duplicating data, one table can reference a row in another table by its unique ID, creating a permanent link between them. If the original account is ever deleted, the linked profile is automatically cleaned up too, rather than being left behind as orphaned data.

This layer also replaced typed email addresses with a **chosen username** for addressing messages — shorter and more natural than a full email, while still being tied back to a verified, authenticated identity underneath.

### Layer 6 — Protocol cleanliness: moving from raw text to structured JSON

Every layer up to this point used a testing shortcut inherited from the very first version: messages were plain text, and the server figured out what a message *meant* by inspecting its shape — for example, treating anything starting with `"TO:"` as "send this to someone," and splitting the rest by colons to find the recipient and the text. This worked, but it was fragile in a way that would only get worse: it had no way to represent more than one kind of message, it broke if a message's own content happened to contain a colon, and it gave a real client (a browser or app) nothing consistent to parse.

The fix was adopting what's often called an **envelope pattern**: every message, in both directions, is now a structured object with one field — `type` — that always says what *kind* of message it is, plus whatever other fields that kind needs. For example, a login carries `{ type: "auth", token: ... }`, while a chat message carries `{ type: "message", to: ..., content: ... }`. This is written using **JSON (JavaScript Object Notation)**, a data format built into essentially every programming language, where data is represented as clearly labeled key-value pairs rather than a raw string that has to be manually pulled apart.

This single change solved several problems at once:

- **Fields are read by name, not by position.** There's no more risk of a message's own content accidentally being mistaken for part of the structure around it.
- **The protocol became self-describing.** Both the server and any future client can check `type` first and know exactly which fields to expect next, instead of guessing from string prefixes.
- **It's extensible without breaking anything already built.** Adding a future capability — like a typing indicator or a read receipt — just means introducing a new `type` value. Existing message types don't need to change at all, which is the core property that makes a protocol scale as an app grows.
- **Responses became structured too, not just requests.** Every reply the server sends back — a successful login, an error, message history, a delivered message — is now a labeled object as well, so a client always knows what kind of thing it just received rather than having to infer it.

This was a purely application-layer change — nothing about the database, authentication, or how connections are tracked needed to change alongside it.

### Layer 7 — Closing the public database exposure

Every table created so far used permissive security rules — anyone, authenticated or not, could read or write anything — as a deliberate shortcut to keep testing simple. This layer closed that gap before it could become a real problem.

**Why this mattered at all.** The hosted database automatically exposes every table as a public API, and the key used to reach that API is *not a secret* — it's designed to be embedded directly in a browser's visible source code once a real client exists. In other words, security was never supposed to come from hiding that key; it was always supposed to come from the access rules attached to each table. With the old permissive rules, the moment a real client existed, anyone could take that same public key straight out of the page source, skip the server entirely, and query the database directly — reading every private conversation between every user, or writing messages pretending to be someone else. The server's own logic (only fetch *your* history, only send *your* messages) meant nothing to a request that never went through the server in the first place.

**What changed, table by table:**

- **Messages** — all direct access was removed entirely. There are no rules left that allow an outside request, authenticated or not, to read or write a single row. From now on, this table is reachable only by the server itself.
- **Profiles** — narrowed rather than fully closed, since a person still needs to be able to check "is this username available" before their account even exists, and other people still need to be able to look someone up by username to message them. What *did* tighten: creating a profile now requires the request's own verified identity to match the profile being created — nobody can create or overwrite a profile belonging to someone else.

**How the server keeps working despite messages being fully locked down.** The server itself now connects to the database using a separate, far more privileged key — a **service role** connection, which is trusted completely and bypasses table security rules altogether. This is a deliberate trade of *where* the trust lives: rather than relying on database-level rules to decide who can touch messages, the server itself becomes the sole gatekeeper, since it already verifies every user's identity via their token before it ever touches the database on their behalf. This key is powerful enough that it must never be given to a client or exposed publicly — it stays on the server only.

This also meant separating, for the first time, *two different kinds of database connection* that had previously been the same one: the server's own trusted connection, and the connection a real end-user client would use (the ordinary public key, still used by the sign-up/login step, since that step is standing in for what a real client would do).

**A known, deliberate trade-off.** Usernames remain publicly readable by design, since addressing someone by username and checking availability both require it. This is a narrower exposure than before — it does not expose message content — but it's worth naming honestly rather than glossing over: it's a considered trade-off, not an oversight, and could be tightened further later (for example, by only exposing usernames through a narrower view) if needed.

---

## 3. Problems Encountered Along the Way

Two real bugs came up during development, and both turned out to be the same underlying category of issue: a database security feature called **Row Level Security (RLS)** silently blocking operations that looked, from the code's perspective, like they should have worked fine.

### What Row Level Security actually is

By default, once RLS is turned on for a table, the database denies *every* operation on that table — reads and writes — unless an explicit rule (a "policy") says otherwise. This is a deliberate "deny by default" safety design. The tricky part for a beginner is that a blocked operation due to RLS doesn't necessarily look like a dramatic error — it can just silently do nothing, which is exactly what happened here.

### Problem 1 — Messages appeared to not be saving at all

After building the persistence layer, messages weren't showing up in the database, and history wasn't loading either. Investigating directly in the database revealed the messages table had RLS enabled but **zero policies defined at all** — meaning every single insert and read was being silently rejected, with nothing in the application code actually being wrong. The fix was adding explicit policies stating that reads and writes were allowed. This was also a good checkpoint to understand that "the code runs without crashing" and "the operation actually succeeded" are not the same thing when a database has security rules in place.

### Problem 2 — Creating a profile failed right after signing up

Later, after linking the profile table to authentication, a new error appeared specifically when a brand-new user tried to create their profile immediately after signing up — even though reading and writing to that same table had worked fine in other situations. 

The root cause was subtler: the same database client object that had just been used to sign the user up carried that new login state into every request made right after — meaning the profile-creation request was no longer arriving as an anonymous request, but as a request from a *newly authenticated* user. The existing security policies only accounted for anonymous requests, not authenticated ones, so the request was blocked even though the *intent* was completely legitimate. The fix was extending the policies to explicitly allow both anonymous and authenticated requests. 

The broader lesson here: a database client that has just logged a user in doesn't just remember that fact for authentication purposes — it changes the identity behind *every subsequent request* made with that same client, which has real consequences for how security rules need to be written.

### A note on how these were diagnosed

In both cases, the debugging approach was the same: rather than guessing at the application code, the actual database state and its security configuration were inspected directly first. This confirmed whether data was truly missing or blocked, and revealed the exact rule that was too narrow — turning a vague "it's not working" into a precise, fixable cause.

---

## 4. Where the Project Stands Now

At this point, the system has all three foundational pillars of a working chat backend in place:

- **Real-time delivery** — messages sent by one connected client are routed live to another connected client through the server.
- **Persistence** — every message is saved to the database regardless of whether the recipient is online, and offline recipients receive their missed messages automatically the next time they connect.
- **Verified identity** — every participant's identity is confirmed through a signed authentication token rather than trusted at face value, and is linked to a proper profile record with a unique chosen username.
- **A structured protocol** — every message exchanged in either direction is a labeled JSON object rather than a hand-parsed string, giving the system a consistent, extensible foundation to build new message types on top of.
- **Closed public database exposure** — the database is no longer directly reachable by an outside request for anything sensitive; the server itself is now the sole trusted gatekeeper to conversation data.

## 5. What's Still Left to Do

- **Build an actual client** — everything so far has been tested through a raw terminal connection standing in for a real app. No browser page or app interface exists yet.
- **Handle real-world edge cases** — such as the same person being connected from two devices at once, reconnecting gracefully after a dropped connection, and optional features like delivered/read receipts or typing indicators.
- **The interest-matching feature itself** — this entire project so far is the messaging *infrastructure*; the actual feature of matching university students by shared interests has not been started yet and sits on top of this foundation.