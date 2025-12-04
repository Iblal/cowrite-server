# Cowrite Server

The backend server for Cowrite, a real-time collaborative writing application. Built with Node.js, Express, and Hocuspocus.

## Features

- **Real-time Collaboration:** Powered by [Hocuspocus](https://tiptap.dev/hocuspocus) and Yjs for seamless multi-user editing.
- **REST API:** Express-based API for user authentication and document management.
- **Database:** PostgreSQL database managed with Prisma ORM.
- **Authentication:** Secure JWT-based authentication.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Collaboration Server:** Hocuspocus
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Language:** TypeScript
- **Testing:** Vitest

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

### Installation

1.  Navigate to the server directory:

    ```bash
    cd cowrite-server
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env` file in the root directory and add the following:

    ```env
    DATABASE_URL="postgresql://user:password@localhost:5432/cowrite?schema=public"
    JWT_SECRET="your-super-secret-key"
    PORT=3000
    ```

4.  Run database migrations:
    ```bash
    npx prisma migrate dev
    ```

### Running the Server

- **Development Mode:**

  ```bash
  npm run dev
  ```

- **Production Build:**
  ```bash
  npm run build
  npm start
  ```

### Testing

Run the test suite with Vitest:

```bash
npm test
```

## API Endpoints

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive a JWT
- `GET /documents` - List user documents
- `POST /documents` - Create a new document
- `GET /documents/:id` - Get document details

## WebSocket

The Hocuspocus server runs on the same port, handling WebSocket connections for real-time document syncing.
