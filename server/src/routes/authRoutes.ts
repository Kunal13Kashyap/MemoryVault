import { Router } from "express";
import { z } from "zod";
import { createAccessToken, requireAuth } from "../middleware/requireAuth.js";
import { User } from "../models/User.js";
import { hashPassword, verifyPassword } from "../services/password.js";
import { requireUserId } from "../utils/requireUserId.js";
import { HttpError } from "../errors/HttpError.js";

const router = Router();

const credentialsSchema = z.object({
    email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
    password: z.string().min(8).max(128)
});

router.post("/register", async (req, res) => {
    const { email, password } = credentialsSchema.parse(req.body);
    const user = await User.create({
        email,
        passwordHash: await hashPassword(password)
    });

    res.status(201).json({
        user: { id: user._id.toString(), email: user.email },
        token: createAccessToken(user._id.toString())
    });
});

router.post("/login", async (req, res) => {
    const { email, password } = credentialsSchema.parse(req.body);
    const user = await User.findOne({ email }).select("+passwordHash").exec();

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
        throw new HttpError(401, "Email or password is incorrect");
    }

    res.json({
        user: { id: user._id.toString(), email: user.email },
        token: createAccessToken(user._id.toString())
    });
});

router.get("/me", requireAuth, async (req, res) => {
    const user = await User.findById(requireUserId(req)).exec();

    if (!user) {
        throw new HttpError(401, "Account no longer exists");
    }

    res.json({ id: user._id.toString(), email: user.email });
});

export default router;
