import type { Request } from "express";
import { HttpError } from "../errors/HttpError.js";

export const requireUserId = (req: Request) => {
    if (!req.userId) {
        throw new HttpError(401, "Authentication required");
    }

    return req.userId;
};
