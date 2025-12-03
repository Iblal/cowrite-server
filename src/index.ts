import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRouter from "./routes/auth.ts";
import documentsRouter from "./routes/documents.ts";
import log from "./utils/logger.ts";
import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import prisma from "./db.ts";
import jwt from "jsonwebtoken";

const port = process.env.PORT;
const hocusPort = Number(process.env.HOCUS_PORT || Number(port) + 1);

const hocuspocusServer = new Server({
  port: hocusPort,
  async onAuthenticate(data) {
    const { token } = data;
    const documentId = Number(data.documentName);

    if (!token) {
      throw new Error("Not authorized");
    }

    let userId: number;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = Number(decoded.userId || decoded.id);
    } catch (err) {
      throw new Error("Invalid token");
    }

    if (!userId || isNaN(userId)) {
      throw new Error("Invalid token");
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { collaborators: true },
    });

    if (!document) throw new Error("Document not found");

    if (document.owner_id === userId) {
      return { user: { id: userId, permission: "owner" } };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const collaborator = document.collaborators.find(
      (c) => c.email === user.email
    );

    if (collaborator) {
      if (collaborator.permission === "read") {
        data.connectionConfig.readOnly = true;
      }
      return { user: { id: userId, permission: collaborator.permission } };
    }

    throw new Error("Not authorized");
  },
  extensions: [
    new Database({
      fetch: async ({ documentName }) => {
        const id = Number(documentName);
        if (isNaN(id)) return null;

        const document = await prisma.document.findUnique({
          where: { id },
          select: { yjs_state_blob: true },
        });

        return document?.yjs_state_blob && document.yjs_state_blob.length > 0
          ? document.yjs_state_blob
          : null;
      },
      store: async ({ documentName, state, context }) => {
        const id = Number(documentName);
        if (isNaN(id)) return;

        try {
          const lastEditorId = (context as any)?.user?.id as number | undefined;

          await prisma.document.update({
            where: { id },
            data: {
              yjs_state_blob: Buffer.from(state),
              ...(lastEditorId ? { last_edited_by_id: lastEditorId } : {}),
            },
          });
        } catch (err) {
          log.error(`Failed to save document ${documentName}`);
        }
      },
    }),
  ],
});

const app = express();

if (!port) {
  throw new Error("PORT environment variable is not defined");
}

app.use(cors());

app.use(bodyParser.json());

app.use("/api/auth", authRouter);
app.use("/api/documents", documentsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start collaboration server on its own port
hocuspocusServer.listen();

app.listen(port, () => {
  log.info(`Server is running on port ${port}`);
  log.info(`Hocuspocus collaboration server listening on port ${hocusPort}`);
});
