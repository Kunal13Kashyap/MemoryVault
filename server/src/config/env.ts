import "dotenv/config";
import process from "node:process";

const dbUrl = process.env.MONGODB_URL;
const jwtSecret = process.env.JWT_SECRET;

if (!dbUrl) {
    throw new Error("Missing required environment variable: MONGODB_URL");
}

if (!jwtSecret || jwtSecret.trim().length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
}

const parsedPort = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error("PORT must be a valid port number");
}

export const env = {
    PORT: parsedPort,
    DB_URL: dbUrl,
    JWT_SECRET: jwtSecret,
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    LLAMA_CPP_BASE_URL: process.env.LLAMA_CPP_BASE_URL ?? "http://127.0.0.1:8080/v1",
    LLAMA_CPP_MODEL: process.env.LLAMA_CPP_MODEL,
    LLAMA_CPP_API_KEY: process.env.LLAMA_CPP_API_KEY
};