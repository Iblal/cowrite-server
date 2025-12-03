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
        last_edited_by_id: userId,
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
      include: {
        last_edited_by: {
          select: {
            name: true,
            email: true,
          },
        },
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

router.get("/shared", async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const docs = await prisma.document.findMany({
      where: {
        collaborators: {
          some: {
            email: user.email,
          },
        },
      },
      include: {
        last_edited_by: {
          select: {
            name: true,
            email: true,
          },
        },
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updated_at: "desc",
      },
    });

    return res.status(200).json(docs);
  } catch (err) {
    log.error(err, "Error fetching shared documents");
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
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const doc = await prisma.document.findFirst({
      where: {
        id: parseInt(id),
        OR: [
          { owner_id: userId },
          { collaborators: { some: { email: user.email } } },
        ],
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        last_edited_by: {
          select: {
            name: true,
            email: true,
          },
        },
        collaborators: true,
      },
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Determine current user's permission
    let permission = "read";
    if (doc.owner_id === userId) {
      permission = "owner";
    } else {
      const collaborator = doc.collaborators.find(
        (c) => c.email === user.email
      );
      if (collaborator) permission = collaborator.permission;
    }

    return res.status(200).json({ ...doc, currentUserPermission: permission });
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

router.post("/:id/share", async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { email, permission } = req.body;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const doc = await prisma.document.findFirst({
      where: { id: parseInt(id), owner_id: userId },
    });

    if (!doc) return res.status(403).json({ error: "Not authorized" });

    const collaborator = await prisma.collaborator.upsert({
      where: {
        document_id_email: {
          document_id: parseInt(id),
          email: email,
        },
      },
      update: { permission },
      create: {
        document_id: parseInt(id),
        email,
        permission,
      },
    });

    return res.status(200).json(collaborator);
  } catch (err) {
    log.error(err, "Error sharing document");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
