import express from "express";
import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";

const bcryptMock = vi.hoisted(() => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

const jwtMock = vi.hoisted(() => ({
  sign: vi.fn(),
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("bcrypt", () => ({
  default: bcryptMock,
}));

vi.mock("jsonwebtoken", () => ({
  default: jwtMock,
}));

vi.mock("../../db.js", () => ({
  prisma: prismaMock,
}));

const { compare: compareMock, hash: hashMock } = bcryptMock;
const { sign: signMock } = jwtMock;

import authRouter from "../auth.js";

describe("auth routes", () => {
  const app = express().use(express.json(), authRouter);

  beforeEach(() => {
    compareMock.mockReset();
    hashMock.mockReset();
    signMock.mockReset();
    prismaMock.user.create.mockReset();
    prismaMock.user.findUnique.mockReset();
  });

  it("returns 400 when registering without email", async () => {
    const response = await request(app)
      .post("/register")
      .send({ password: "abc" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Email, password, and name are required",
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 when logging in without password", async () => {
    const response = await request(app)
      .post("/login")
      .send({ email: "user@example.com" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "Email and password are required" });
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 401 when credentials are incorrect", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 7,
      password_hash: "stored_hash",
    });
    compareMock.mockResolvedValue(false);

    const response = await request(app)
      .post("/login")
      .send({ email: "user@example.com", password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Invalid email or password" });
    expect(compareMock).toHaveBeenCalledWith("wrong", "stored_hash");
    expect(signMock).not.toHaveBeenCalled();
  });
});
