# ✍️ Cowrite: Collaborative Markdown Editor (MVP)

## 🌟 Introduction

**Cowrite** is a real-time, collaborative Markdown editor designed to allow users to work on documents simultaneously, completely free of synchronization conflicts.

This repository (`cowrite-server`) hosts the **Node.js/Express TypeScript API** and the **WebSocket Server** responsible for handling authentication, document persistence, and broadcasting real-time updates using **Yjs (CRDTs)**.

---

## 💻 Tech Stack & Setup

| Component         | Technology      | Role                                                 |
| :---------------- | :-------------- | :--------------------------------------------------- |
| **Runtime**       | **Node.js**     | Server environment.                                  |
| **Language**      | **TypeScript**  | Type safety and improved scalability.                |
| **Framework**     | **Express**     | REST API.                                            |
| **Persistence**   | **PostgreSQL**  | Robust storage for Users and Binary Document States. |
| **Collaboration** | **Yjs (CRDTs)** | Conflict-free data structure for real-time merging.  |
| **Real-Time**     | **WebSockets**  | Persistent connection for Yjs updates.               |

### Quick Setup

1.  **Clone:** `git clone <server-repo-url> cowrite-server`
2.  **Install:** `npm install`
3.  **Config:** Create a **`.env`** file (DB credentials, JWT secret, etc.).
4.  **DB:** Ensure PostgreSQL is running and initialize `users` and `documents` tables.
5.  **Run:** `npm start` (Runs `index.ts` via `ts-node`).

---

## 🎯 MVP Requirements

The primary goal is establishing the **Real-Time Collaboration Core** without data loss.

| #      | Feature            | Goal                                                                                                  |
| :----- | :----------------- | :---------------------------------------------------------------------------------------------------- |
| **M1** | **Authentication** | Users can **register** and **log in** securely via JWT.                                               |
| **M2** | **Document CRUD**  | Users can **create**, **read a list**, and **read a single** document.                                |
| **M3** | **Real-Time Sync** | Changes by two simultaneous editors must **merge instantly** and **correctly** using **CRDTs (Yjs)**. |
| **M4** | **Persistence**    | The final, merged document state (the `yjs_state_blob`) is reliably saved to the database.            |

---

## 🔗 API Endpoints

All endpoints (except Auth) require a **valid JWT** in the `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)

| Method | Endpoint             | Description                           |
| :----- | :------------------- | :------------------------------------ |
| `POST` | `/api/auth/register` | Create a new user.                    |
| `POST` | `/api/auth/login`    | Authenticate user; returns JWT token. |

### Document Management (`/api/documents`)

| Method | Endpoint             | Description                                         |
| :----- | :------------------- | :-------------------------------------------------- |
| `POST` | `/api/documents`     | Create a new document.                              |
| `GET`  | `/api/documents`     | List documents owned by the user.                   |
| `GET`  | `/api/documents/:id` | Fetch the metadata and the binary `yjs_state_blob`. |

### 📡 WebSocket Endpoint

The real-time layer connects here. The JWT must be validated during the initial connection handshake.

- **Endpoint:** `ws://<server-host>:<ws-port>/doc/:id`
