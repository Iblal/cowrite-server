import express from "express";
import type { Request, Response, NextFunction } from "express";
import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  document: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
  collaborator: {
    upsert: vi.fn(),
  },
}));

const authState = vi.hoisted(() => ({
  userId: 101 as number | undefined,
}));

vi.mock("../../db.js", () => ({
  prisma: prismaMock,
}));

vi.mock("../../middleware/auth.js", () => ({
  authenticateToken: (req: Request, _res: Response, next: NextFunction) => {
    if (typeof authState.userId !== "undefined") {
      req.userId = authState.userId;
    } else {
      delete req.userId;
    }
    next();
  },
}));

import documentsRouter from "../documents.js";

describe("documents routes", () => {
  const app = express().use(express.json(), documentsRouter);

  beforeEach(() => {
    authState.userId = 101;
    prismaMock.document.create.mockReset();
    prismaMock.document.findMany.mockReset();
    prismaMock.document.findFirst.mockReset();
    prismaMock.document.update.mockReset();
    prismaMock.user.findUnique.mockReset();
    prismaMock.collaborator.upsert.mockReset();
  });

  it("returns 401 when creating without user context", async () => {
    authState.userId = undefined;

    const res = await request(app).post("/").send({ title: "Doc" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(prismaMock.document.create).not.toHaveBeenCalled();
  });

  it("creates a document using the fallback title for blank input", async () => {
    const created = { id: 1, title: "Untitled Document" };
    prismaMock.document.create.mockResolvedValue(created);

    const res = await request(app).post("/").send({ title: "   " });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
    expect(prismaMock.document.create).toHaveBeenCalledTimes(1);

    const callArgs = prismaMock.document.create.mock.calls[0];
    if (!callArgs) {
      throw new Error("document.create was not called");
    }
    const [args] = callArgs;
    expect(args.data.title).toBe("Untitled Document");
    expect(args.data.owner_id).toBe(101);
    expect(Buffer.isBuffer(args.data.yjs_state_blob)).toBe(true);
    expect(args.data.yjs_state_blob.length).toBe(0);
    expect(args.select).toEqual({ id: true, title: true });
  });

  it("creates a document with provided title", async () => {
    const created = {
      id: 2,
      title: "My Doc",
    };
    prismaMock.document.create.mockResolvedValue(created);

    const res = await request(app).post("/").send({ title: "My Doc" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
    expect(prismaMock.document.create).toHaveBeenCalledTimes(1);

    const callArgs = prismaMock.document.create.mock.calls[0];
    if (!callArgs) {
      throw new Error("document.create was not called");
    }
    const [args] = callArgs;
    expect(args.data.title).toBe("My Doc");
  });

  it("lists documents for the authenticated user", async () => {
    const documents = [
      { id: 5, title: "Doc A", updated_at: "2024-10-10T00:00:00.000Z" },
      { id: 6, title: "Doc B", updated_at: "2024-10-09T00:00:00.000Z" },
    ];
    prismaMock.document.findMany.mockResolvedValue(documents);

    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(documents);
    expect(prismaMock.document.findMany).toHaveBeenCalledWith({
      where: { owner_id: 101 },
      select: { id: true, title: true, updated_at: true },
      orderBy: { updated_at: "desc" },
    });
  });

  it("returns 401 for list fetches when no user id is available", async () => {
    authState.userId = undefined;

    const res = await request(app).get("/");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
    expect(prismaMock.document.findMany).not.toHaveBeenCalled();
  });

  it("returns 404 when a document is missing", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 101,
      email: "test@example.com",
    });
    prismaMock.document.findFirst.mockResolvedValue(null);

    const res = await request(app).get("/42");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Document not found" });
  });

  it("returns the requested document when it exists", async () => {
    const document = {
      id: 7,
      owner_id: 101,
      title: "My Doc",
      updated_at: new Date().toISOString(),
      yjs_state_blob: Buffer.alloc(0),
      collaborators: [],
    };
    prismaMock.user.findUnique.mockResolvedValue({
      id: 101,
      email: "test@example.com",
    });
    prismaMock.document.findFirst.mockResolvedValue(document);

    const res = await request(app).get("/7");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(7);
    expect(res.body.title).toBe("My Doc");
    expect(res.body.owner_id).toBe(101);
    expect(res.body.yjs_state_blob).toEqual({ type: "Buffer", data: [] });
  });

  it("updates a document successfully", async () => {
    const existingDoc = {
      id: 8,
      owner_id: 101,
      title: "Old Title",
    };
    const updatedDoc = {
      id: 8,
      owner_id: 101,
      title: "New Title",
    };

    prismaMock.document.findFirst.mockResolvedValue(existingDoc);
    prismaMock.document.update.mockResolvedValue(updatedDoc);

    const res = await request(app).put("/8").send({ title: "New Title" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updatedDoc);
    expect(prismaMock.document.findFirst).toHaveBeenCalledWith({
      where: { id: 8, owner_id: 101 },
    });
    expect(prismaMock.document.update).toHaveBeenCalledWith({
      where: { id: 8 },
      data: { title: "New Title" },
    });
  });

  it("returns 404 when updating a non-existent document", async () => {
    prismaMock.document.findFirst.mockResolvedValue(null);

    const res = await request(app).put("/999").send({ title: "New Title" });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Document not found" });
    expect(prismaMock.document.update).not.toHaveBeenCalled();
  });
});
