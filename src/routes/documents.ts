import { Router } from "express";
import { prisma } from "../db.js";
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
    const doc = await prisma.document.create({
      data: {
        title: docTitle,
        owner_id: userId,
        yjs_state_blob: emptyBuffer,
      },
      select: {
        id: true,
        title: true,
      },
    });

    return res.status(201).json(doc);
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
    const docs = await prisma.document.findMany({
      where: {
        owner_id: userId,
      },
      select: {
        id: true,
        title: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    return res.status(200).json(docs);
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
    const doc = await prisma.document.findFirst({
      where: {
        id: parseInt(id),
        owner_id: userId,
      },
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.status(200).json(doc);
  } catch (err) {
    console.error("Error fetching document", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
