import { randomUUID } from "node:crypto";
import { open, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { HttpError } from "../errors/HttpError.js";

const uploadDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../uploads"
);

export const uploadMiddleware = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => {
            void mkdir(uploadDirectory, { recursive: true }).then(
                () => callback(null, uploadDirectory),
                (error: NodeJS.ErrnoException) => callback(error, uploadDirectory)
            );
        },
        filename: (_req, _file, callback) => callback(null, randomUUID())
    }),
    limits: {
        fileSize: 15 * 1024 * 1024,
        files: 1,
        fields: 8
    },
    fileFilter: (_req, file, callback) => {
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            callback(new HttpError(400, "Upload a PDF document or a JPEG, PNG, or WebP photo"));
            return;
        }

        callback(null, true);
    }
});

export const removeUpload = async (storageKey: string) => {
    if (!/^[\da-f-]+$/i.test(storageKey)) {
        throw new Error("Invalid generated upload identifier");
    }

    try {
        await unlink(path.join(uploadDirectory, storageKey));
    } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            return;
        }
        throw error;
    }
};

export const detectUploadContentType = async (filePath: string) => {
    const file = await open(filePath, "r");
    const header = Buffer.alloc(12);

    try {
        const { bytesRead } = await file.read(header, 0, header.length, 0);
        const bytes = header.subarray(0, bytesRead);

        if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-") {
            return "application/pdf";
        }
        if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
            return "image/jpeg";
        }
        if (
            bytes.length >= 8 &&
            bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        ) {
            return "image/png";
        }
        if (
            bytes.length >= 12 &&
            bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
            bytes.subarray(8, 12).toString("ascii") === "WEBP"
        ) {
            return "image/webp";
        }
        return null;
    } finally {
        await file.close();
    }
};

export const getUploadPath = (storageKey: string) => {
    if (!/^[\da-f-]+$/i.test(storageKey)) {
        throw new Error("Invalid generated upload identifier");
    }
    return path.join(uploadDirectory, storageKey);
};
