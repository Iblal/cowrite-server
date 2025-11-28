import type { Request, Response, NextFunction } from "express";
import { describe, expect, it, vi, beforeEach } from "vitest";

const jwtMock = vi.hoisted(() => ({
  verify: vi.fn(),
}));

vi.mock("jsonwebtoken", () => ({
  default: jwtMock,
}));

const { verify: verifyMock } = jwtMock;

import { authenticateToken } from "../auth.js";

function createMockRes() {
  const res: Partial<Response> & {
    statusCode?: number;
    payload?: unknown;
  } = {};

  res.status = vi.fn().mockImplementation(function status(code: number) {
    res.statusCode = code;
    return res as Response;
  });

  res.json = vi.fn().mockImplementation(function json(payload: unknown) {
    res.payload = payload;
    return res as Response;
  });

  return res as Response & { statusCode?: number; payload?: unknown };
}

describe("authenticateToken", () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    verifyMock.mockReset();
    next = vi.fn();
  });

  it("responds with 401 when no authorization header is present", () => {
    const req = {
      headers: {},
    } as Request;
    const res = createMockRes();

    authenticateToken(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing token" });
    expect(next).not.toHaveBeenCalled();
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("responds with 403 when jwt verification fails", () => {
    const req = {
      headers: { authorization: "Bearer invalid" },
    } as Request;
    const res = createMockRes();

    verifyMock.mockImplementation((_token, _secret, callback: any) => {
      callback(new Error("invalid"));
    });

    authenticateToken(req, res, next as unknown as NextFunction);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("stores the decoded user id and calls next when token is valid", () => {
    const req = {
      headers: { authorization: "Bearer valid" },
    } as Request;
    const res = createMockRes();

    verifyMock.mockImplementation((_token, _secret, callback: any) => {
      callback(null, { id: 123 });
    });

    authenticateToken(req, res, next as unknown as NextFunction);

    expect(req.userId).toBe(123);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
