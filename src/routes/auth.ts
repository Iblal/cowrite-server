import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db.ts";
import log from "../utils/logger.ts";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const SALT_ROUNDS = 10;

router.post("/register", async (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ error: "Email, password, and name are required" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        created_at: true,
      },
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err: any) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    log.error(err, "Error registering user");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({ token });
  } catch (err) {
    log.error(err, "Error logging in");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
