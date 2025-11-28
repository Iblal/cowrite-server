import { Router } from "express";
import { pool } from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.use(authenticateToken);

router.post("/", async (req, res) => {
  const userId = req.userId;
  const { title } = req.body as { title?: string };

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const docTitle =
    title && title.trim().length > 0 ? title : "Untitled Document";
  const emptyBuffer = Buffer.alloc(0);

  try {
    const result = await pool.query(
      "INSERT INTO documents (title, owner_id, yjs_state_blob, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, title",
      [docTitle, userId, emptyBuffer]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating document", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      "SELECT id, title, updated_at FROM documents WHERE owner_id = $1 ORDER BY updated_at DESC",
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching documents", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await pool.query(
      "SELECT id, title, owner_id, yjs_state_blob, created_at, updated_at FROM documents WHERE id = $1 AND owner_id = $2",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const doc = result.rows[0];

    return res.status(200).json(doc);
  } catch (err) {
    console.error("Error fetching document", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
