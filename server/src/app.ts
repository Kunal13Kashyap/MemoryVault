import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { HttpError } from "./errors/HttpError.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/requireAuth.js";
import authRoutes from "./routes/authRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";

export const createApp = () => {
    const app = express();

    app.use(cors({ origin: env.CLIENT_ORIGIN }));
    app.use(express.json({ limit: "1mb" }));

    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api", requireAuth, familyRoutes);

    app.use((_req, _res, next) => {
        next(new HttpError(404, "Route not found"));
    });

    app.use(errorHandler);
    return app;
};
