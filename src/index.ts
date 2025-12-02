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

const port = process.env.PORT;
const hocusPort = Number(process.env.HOCUS_PORT || Number(port) + 1);

const hocuspocusServer = new Server({
  port: hocusPort,
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
      store: async ({ documentName, state }) => {
        const id = Number(documentName);
        if (isNaN(id)) return;

        try {
          await prisma.document.update({
            where: { id },
            data: {
              yjs_state_blob: Buffer.from(state),
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
