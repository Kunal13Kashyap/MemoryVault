import process from "node:process";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

const startServer = async () => {
    await connectDB();

    const app = createApp();
    const server = app.listen(env.PORT, () => {
        console.log(`MemoryVault API listening on port ${env.PORT}`);
    });

    const shutdown = () => {
        server.close(() => {
            void mongoose.disconnect().catch(() => {
                console.error("Failed to disconnect from MongoDB during shutdown");
                process.exitCode = 1;
            });
        });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
};

startServer().catch((error: unknown) => {
    console.error(
        "Server startup failed:",
        error instanceof Error ? error.name : "Unknown error"
    );
    process.exitCode = 1;
});
