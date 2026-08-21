
# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c12f6648-4738-43ea-895c-fae4b3313dc8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
=======
# Real-Time Chat Backend — Project Overview

This document explains what this project is, how it was built (in the order it was actually built), the core concepts behind every decision, and the specific problems that came up along the way and how they were solved. It's written so that someone with no prior background could read it and understand *why* a chat backend is built the way it is — not just *that* it works.

This chat system is being built as the messaging layer for a larger university interest-matching app — the goal there is to match students by shared interests instead of random browsing, and this backend handles the actual conversations between matched users once they're connected.

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

## 5. What's Still Left to Do

- **Tighten database security policies** — the current rules are intentionally permissive (allowing broad read/write access) to make testing easier. Before this is used by real people, these need to be narrowed — for example, so a person can only read messages where they are the sender or the receiver.
- **Move from a plain-text testing protocol to a structured message format** — the current "type this exact pattern of text" approach was a deliberate shortcut for testing through a terminal, and will need to become a proper structured format before a real client application is built on top of it.
- **Build an actual client** — everything so far has been tested through a raw terminal connection standing in for a real app. No browser page or app interface exists yet.
- **Handle real-world edge cases** — such as the same person being connected from two devices at once, reconnecting gracefully after a dropped connection, and optional features like delivered/read receipts or typing indicators.
- **The interest-matching feature itself** — this entire project so far is the messaging *infrastructure*; the actual feature of matching university students by shared interests has not been started yet and sits on top of this foundation.
>>>>>>> 342aa1bcac499afbb9f3a3ae1bea5b29d0c71279
