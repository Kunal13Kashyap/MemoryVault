import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { basename } from "node:path";
import { HttpError } from "../errors/HttpError.js";
import { Family } from "../models/Family.js";
import { FamilyMember } from "../models/FamilyMember.js";
import { memoryTypes, Memory } from "../models/Memory.js";
import { findRelevantMemories } from "../services/memorySearch.js";
import { generateAnswer } from "../services/lmStudio.js";
import {
    detectUploadContentType,
    getUploadPath,
    removeUpload,
    uploadMiddleware
} from "../services/uploadStorage.js";
import { requireUserId } from "../utils/requireUserId.js";

const router = Router();

const familySchema = z.object({
    name: z.string().trim().min(1).max(100)
});

const memberSchema = z.object({
    name: z.string().trim().min(1).max(100),
    relation: z.string().trim().max(80).optional(),
    avatarUrl: z.string().trim().url().max(2048).optional()
});

const memorySchema = z.object({
    title: z.string().trim().min(1).max(160),
    content: z.string().trim().max(20000).optional().default(""),
    type: z.enum(memoryTypes),
    memberIds: z.array(z.string()).max(100).optional(),
    isUserAssociated: z.preprocess(
        (value) => value === "true" ? true : value === "false" ? false : value,
        z.boolean().optional()
    ),
    memberId: z.string().nullable().optional()
});

const updateMemorySchema = memorySchema.partial();

const questionSchema = z.object({
    question: z.string().trim().min(2).max(1000)
});

const requireObjectId = (id: string) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new HttpError(400, "Invalid ID");
    }
};

const requireRouteParam = (value: string | string[] | undefined) => {
    if (typeof value !== "string") {
        throw new HttpError(400, "Invalid route parameter");
    }
    return value;
};

const findOwnedFamily = async (familyId: string, userId: string) => {
    requireObjectId(familyId);
    const family = await Family.findOne({ _id: familyId, ownerId: userId }).exec();

    if (!family) {
        throw new HttpError(404, "Family not found");
    }

    return family;
};

const findOwnedMemory = async (memoryId: string, userId: string) => {
    requireObjectId(memoryId);
    const memory = await Memory.findById(memoryId).exec();

    if (!memory) {
        throw new HttpError(404, "Memory not found");
    }

    await findOwnedFamily(memory.familyId.toString(), userId);
    return memory;
};

router.get("/families", async (req, res) => {
    const families = await Family.find({ ownerId: requireUserId(req) })
        .sort({ createdAt: -1 })
        .exec();

    res.json(families.map((family) => ({
        id: family._id.toString(),
        name: family.name,
        createdAt: family.createdAt,
        updatedAt: family.updatedAt
    })));
});

router.post("/families", async (req, res) => {
    const { name } = familySchema.parse(req.body);
    const family = await Family.create({ name, ownerId: requireUserId(req) });

    res.status(201).json({
        id: family._id.toString(),
        name: family.name,
        createdAt: family.createdAt,
        updatedAt: family.updatedAt
    });
});

router.get("/families/:familyId", async (req, res) => {
    const family = await findOwnedFamily(req.params.familyId, requireUserId(req));

    res.json({
        id: family._id.toString(),
        name: family.name,
        createdAt: family.createdAt,
        updatedAt: family.updatedAt
    });
});

router.patch("/families/:familyId", async (req, res) => {
    const { name } = familySchema.parse(req.body);
    const family = await findOwnedFamily(req.params.familyId, requireUserId(req));
    family.name = name;
    await family.save();

    res.json({
        id: family._id.toString(),
        name: family.name,
        createdAt: family.createdAt,
        updatedAt: family.updatedAt
    });
});

router.get("/families/:familyId/members", async (req, res) => {
    await findOwnedFamily(req.params.familyId, requireUserId(req));
    const members = await FamilyMember.find({ familyId: req.params.familyId })
        .sort({ name: 1 })
        .exec();

    res.json(members.map((member) => ({
        id: member._id.toString(),
        familyId: member.familyId.toString(),
        name: member.name,
        relation: member.relation,
        avatarUrl: member.avatarUrl,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
    })));
});

router.post("/families/:familyId/members", async (req, res) => {
    const body = memberSchema.parse(req.body);
    await findOwnedFamily(req.params.familyId, requireUserId(req));
    const member = await FamilyMember.create({
        familyId: req.params.familyId,
        name: body.name,
        relation: body.relation ?? "",
        avatarUrl: body.avatarUrl ?? ""
    });

    res.status(201).json({
        id: member._id.toString(),
        familyId: member.familyId.toString(),
        name: member.name,
        relation: member.relation,
        avatarUrl: member.avatarUrl,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
    });
});

router.patch("/families/:familyId/members/:memberId", async (req, res) => {
    const body = memberSchema.partial().parse(req.body);
    await findOwnedFamily(req.params.familyId, requireUserId(req));
    requireObjectId(req.params.memberId);

    const member = await FamilyMember.findOne({
        _id: req.params.memberId,
        familyId: req.params.familyId
    }).exec();

    if (!member) {
        throw new HttpError(404, "Family member not found");
    }

    if (body.name !== undefined) member.name = body.name;
    if (body.relation !== undefined) member.relation = body.relation;
    if (body.avatarUrl !== undefined) member.avatarUrl = body.avatarUrl;
    await member.save();

    res.json({
        id: member._id.toString(),
        familyId: member.familyId.toString(),
        name: member.name,
        relation: member.relation,
        avatarUrl: member.avatarUrl,
        createdAt: member.createdAt,
        updatedAt: member.updatedAt
    });
});

router.delete("/families/:familyId/members/:memberId", async (req, res) => {
    await findOwnedFamily(req.params.familyId, requireUserId(req));
    requireObjectId(req.params.memberId);
    const member = await FamilyMember.findOneAndDelete({
        _id: req.params.memberId,
        familyId: req.params.familyId
    }).exec();

    if (!member) {
        throw new HttpError(404, "Family member not found");
    }

    await Memory.updateMany(
        { familyId: req.params.familyId, memberId: req.params.memberId },
        { $set: { memberId: null } }
    ).exec();
    await Memory.updateMany(
        { familyId: req.params.familyId },
        { $pull: { memberIds: req.params.memberId } }
    ).exec();

    res.status(204).send();
});

router.get("/families/:familyId/memories", async (req, res) => {
    await findOwnedFamily(req.params.familyId, requireUserId(req));

    const limitResult = z.coerce.number().int().min(1).max(100).safeParse(req.query.limit ?? 50);
    if (!limitResult.success) {
        throw new HttpError(400, "limit must be a number between 1 and 100");
    }

    const memories = await Memory.find({ familyId: req.params.familyId })
        .sort({ createdAt: -1 })
        .limit(limitResult.data)
        .exec();

    res.json(memories.map(serializeMemory));
});

router.post(
    "/families/:familyId/memories",
    uploadMiddleware.single("attachment"),
    async (req, res) => {
        let persisted = false;
        try {
            const body = memorySchema.parse(parseMultipartBody(req.body));
            const familyId = requireRouteParam(req.params.familyId);
            await findOwnedFamily(familyId, requireUserId(req));
            const memberIds = await validateMemberIds(
                body.memberIds,
                body.memberId,
                familyId
            );
            const attachment = await getAttachmentFromUpload(req.file, body.type);

            if (isFileMemoryType(body.type) && !attachment) {
                throw new HttpError(400, "Attach a file to document and photo memories");
            }
            if (!isFileMemoryType(body.type) && body.content.length === 0) {
                throw new HttpError(400, "Memory text is required for this type");
            }

            const memory = await Memory.create({
                familyId,
                memberIds,
                memberId: null,
                isUserAssociated: body.isUserAssociated ?? false,
                title: body.title,
                content: body.content,
                type: body.type,
                ...(attachment ? { attachment } : {})
            });
            persisted = true;

            res.status(201).json(serializeMemory(memory));
        } catch (error) {
            if (!persisted) {
                await removeFailedUpload(req.file);
            }
            throw error;
        }
    }
);

router.post("/families/:familyId/ask", async (req, res) => {
    const { question } = questionSchema.parse(req.body);
    await findOwnedFamily(req.params.familyId, requireUserId(req));

    const memories = await findRelevantMemories(req.params.familyId, question);

    if (memories.length === 0) {
        res.json({
            answer: "I couldn't find that in this family's saved memories.",
            sources: []
        });
        return;
    }

    const context = memories
        .map((memory) => `Title: ${memory.title}\nMemory: ${memory.content.slice(0, 4000)}`)
        .join("\n\n");
    const answer = await generateAnswer(question, context);

    res.json({
        answer,
        sources: memories.map((memory) => ({
            memoryId: memory._id.toString(),
            title: memory.title
        }))
    });
});

router.get("/memories/:memoryId", async (req, res) => {
    const memory = await findOwnedMemory(
        requireRouteParam(req.params.memoryId),
        requireUserId(req)
    );
    res.json(serializeMemory(memory));
});

router.patch(
    "/memories/:memoryId",
    uploadMiddleware.single("attachment"),
    async (req, res) => {
        let persisted = false;
        try {
            const multipartBody = parseMultipartBody(req.body);
            const body = updateMemorySchema.parse(multipartBody);
            const memory = await findOwnedMemory(
                requireRouteParam(req.params.memoryId),
                requireUserId(req)
            );
            const memberIds = body.memberIds !== undefined || body.memberId !== undefined
                ? await validateMemberIds(
                    body.memberIds,
                    body.memberIds === undefined ? body.memberId : undefined,
                    memory.familyId.toString()
                )
                : undefined;
            const type = body.type ?? memory.type;
            let attachment = memory.attachment;

            if (req.file) {
                attachment = await getAttachmentFromUpload(req.file, type);
            } else if (!isFileMemoryType(type)) {
                attachment = undefined;
            }

            if (isFileMemoryType(type) && !isCompatibleAttachment(type, attachment)) {
                throw new HttpError(400, "Attach a file to document and photo memories");
            }
            if (!isFileMemoryType(type) && (body.content ?? memory.content).length === 0) {
                throw new HttpError(400, "Memory text is required for this type");
            }

            const previousStorageKey = memory.attachment?.storageKey;
            if (body.title !== undefined) memory.title = body.title;
            if (body.content !== undefined) memory.content = body.content;
            if (body.type !== undefined) memory.type = body.type;
            if (memberIds !== undefined) {
                memory.memberIds = memberIds;
                memory.memberId = null;
            }
            if (body.isUserAssociated !== undefined) {
                memory.isUserAssociated = body.isUserAssociated;
            }
            memory.attachment = attachment ?? null;
            await memory.save();
            persisted = true;

            if (previousStorageKey && (!attachment || req.file)) {
                await removeUpload(previousStorageKey);
            }

            res.json(serializeMemory(memory));
        } catch (error) {
            if (!persisted) {
                await removeFailedUpload(req.file);
            }
            throw error;
        }
    }
);

router.get("/memories/:memoryId/attachment", async (req, res, next) => {
    try {
        const memory = await findOwnedMemory(
            requireRouteParam(req.params.memoryId),
            requireUserId(req)
        );
        if (!memory.attachment) {
            throw new HttpError(404, "Memory has no attachment");
        }

        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cache-Control", "private, no-store");
        res.download(
            getUploadPath(memory.attachment.storageKey),
            memory.attachment.fileName,
            (error) => {
                if (error) next(error);
            }
        );
    } catch (error) {
        next(error);
    }
});

router.delete("/memories/:memoryId", async (req, res) => {
    const memory = await findOwnedMemory(req.params.memoryId, requireUserId(req));
    await memory.deleteOne();
    if (memory.attachment) {
        await removeUpload(memory.attachment.storageKey);
    }
    res.status(204).send();
});

const validateMemberIds = async (
    memberIds: string[] | undefined,
    legacyMemberId: string | null | undefined,
    familyId: string
) => {
    const ids = [...new Set(memberIds ?? (legacyMemberId ? [legacyMemberId] : []))];
    ids.forEach(requireObjectId);

    if (ids.length === 0) {
        return [];
    }

    const members = await FamilyMember.find({ _id: { $in: ids }, familyId }).exec();
    if (members.length !== ids.length) {
        throw new HttpError(400, "Every selected person must belong to this family");
    }

    return members.map((member) => member._id);
};

const parseMultipartBody = (body: Record<string, unknown>) => {
    if (typeof body.memberIds !== "string") {
        return body;
    }

    try {
        return { ...body, memberIds: JSON.parse(body.memberIds) as unknown };
    } catch {
        throw new HttpError(400, "Invalid list of selected people");
    }
};

const isFileMemoryType = (type: string) => type === "document" || type === "photo";

const getAttachmentFromUpload = async (
    file: Express.Multer.File | undefined,
    type: string
) => {
    if (!file) {
        return undefined;
    }

    const detectedType = await detectUploadContentType(file.path);
    const validType = detectedType === file.mimetype && isCompatibleAttachment(
        type,
        { contentType: detectedType }
    );

    if (!validType) {
        throw new HttpError(
            400,
            "Upload a valid PDF for documents or a JPEG, PNG, or WebP image for photos"
        );
    }

    const fileName = basename(file.originalname.replace(/\\/g, "/")).replace(/[\r\n"]/g, "").trim();
    if (!fileName) {
        throw new HttpError(400, "The uploaded file must have a name");
    }

    return {
        storageKey: file.filename,
        fileName: fileName.slice(0, 255),
        contentType: file.mimetype,
        size: file.size
    };
};

const isCompatibleAttachment = (
    type: string,
    attachment: { contentType: string } | null | undefined
) => {
    if (!attachment) {
        return false;
    }
    return type === "document"
        ? attachment.contentType === "application/pdf"
        : type === "photo" && attachment.contentType.startsWith("image/");
};

const removeFailedUpload = async (file: Express.Multer.File | undefined) => {
    if (!file) {
        return;
    }

    try {
        await removeUpload(file.filename);
    } catch (cleanupError) {
        console.error("Failed to clean up an unsuccessful memory upload:", cleanupError);
    }
};

const serializeMemory = (memory: InstanceType<typeof Memory>) => ({
    id: memory._id.toString(),
    familyId: memory.familyId.toString(),
    memberIds: [...new Set([
        ...memory.memberIds.map((memberId) => memberId.toString()),
        ...(memory.memberId ? [memory.memberId.toString()] : [])
    ])],
    isUserAssociated: memory.isUserAssociated ?? false,
    memberId: memory.memberId?.toString() ?? null,
    title: memory.title,
    content: memory.content,
    type: memory.type,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
    attachment: memory.attachment
        ? {
            fileName: memory.attachment.fileName,
            contentType: memory.attachment.contentType,
            size: memory.attachment.size
        }
        : null
});

export default router;
