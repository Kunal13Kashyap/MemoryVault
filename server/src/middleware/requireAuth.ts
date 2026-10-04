import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "../errors/HttpError.js";

export const requireAuth: RequestHandler = (req, _res, next) => {
    const authorization = req.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
        next(new HttpError(401, "Authentication required"));
        return;
    }

    try {
        const token = authorization.slice("Bearer ".length);
        const payload = jwt.verify(token, env.JWT_SECRET);

        if (typeof payload === "string" || typeof payload.sub !== "string") {
            throw new HttpError(401, "Invalid or expired token");
        }

        req.userId = payload.sub;
        next();
    } catch (error) {
        next(error instanceof HttpError ? error : new HttpError(401, "Invalid or expired token"));
    }
};

export const createAccessToken = (userId: string) =>
    jwt.sign({ sub: userId } satisfies JwtPayload, env.JWT_SECRET, { expiresIn: "7d" });
