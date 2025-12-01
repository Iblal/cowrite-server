import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRouter from "./routes/auth.ts";
import documentsRouter from "./routes/documents.ts";
import log from "./utils/logger.ts";
import expressWebSockets from "express-ws";
import { Hocuspocus } from "@hocuspocus/server";

const hocuspocus = new Hocuspocus();

const { app } = expressWebSockets(express());
const port = process.env.PORT;

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

app.ws("/collaboration", (websocket, request) => {
  hocuspocus.handleConnection(websocket, request);
});

app.listen(port, () => {
  log.info(`Server is running on port ${port}`);
});
