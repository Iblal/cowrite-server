import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRouter from "./routes/auth.ts";
import documentsRouter from "./routes/documents.ts";
import log from "./utils/logger.ts";
import { startHocuspocusServer } from "./hocuspocus.ts";

const port = process.env.PORT;

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

const { port: hocusPort } = startHocuspocusServer();

app.listen(port, () => {
  log.info(`Server is running on port ${port}`);
  log.info(`Hocuspocus collaboration server listening on port ${hocusPort}`);
});
