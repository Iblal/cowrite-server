import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRouter from "./routes/auth.ts";
import documentsRouter from "./routes/documents.ts";
import log from "./logger.ts";

const app = express();
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

app.listen(port, () => {
  log.info(`Server is running on port ${port}`);
});
