import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRouter from "./routes/auth.ts";
import documentsRouter from "./routes/documents.ts";
import log from "./utils/logger.ts";
import { Server } from "@hocuspocus/server";

const port = process.env.PORT;
const hocusPort = Number(process.env.HOCUS_PORT || Number(port) + 1);

const hocuspocusServer = new Server({
  port: hocusPort,
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
