import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import multer from "multer";
import { ZodError } from "zod";
import { HttpError } from "../errors/HttpError.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
    if (error instanceof ZodError) {
        res.status(400).json({
            error: "Invalid request",
            details: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
        return;
    }

    if (error instanceof HttpError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }

    if (error instanceof multer.MulterError) {
        const message = error.code === "LIMIT_FILE_SIZE"
            ? "Files must be 15 MB or smaller"
            : "The upload could not be accepted";
        res.status(400).json({ error: message });
        return;
    }

    if (error instanceof mongoose.Error.CastError) {
        res.status(400).json({ error: "Invalid ID" });
        return;
    }

    if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({ error: "Invalid data", details: error.message });
        return;
    }

    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
        res.status(409).json({ error: "An account with that email already exists" });
        return;
    }

    if (error instanceof SyntaxError && "status" in error && error.status === 400) {
        res.status(400).json({ error: "Request body contains invalid JSON" });
        return;
    }

    console.error("Unhandled request error:", error);
    res.status(500).json({ error: "Internal server error" });
};
