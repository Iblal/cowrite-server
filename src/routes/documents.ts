import { Router } from "express";
import { prisma } from "../db.ts";
import { authenticateToken } from "../middleware/auth.ts";
import log from "../utils/logger.ts";

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
    log.error(err, "Error creating document");
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
    log.error(err, "Error fetching documents");
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
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    return res.status(200).json(doc);
  } catch (err) {
    log.error(err, "Error fetching document");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { title } = req.body;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // First check if document exists and belongs to user
    const existingDoc = await prisma.document.findFirst({
      where: {
        id: parseInt(id),
        owner_id: userId,
      },
    });

    if (!existingDoc) {
      return res.status(404).json({ error: "Document not found" });
    }

    const updatedDoc = await prisma.document.update({
      where: {
        id: parseInt(id),
      },
      data: {
        title: title ?? existingDoc.title,
      },
    });

    return res.status(200).json(updatedDoc);
  } catch (err) {
    log.error(err, "Error updating document");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
