import { Memory } from "../models/Memory.js";

const ignoredTerms = new Set([
    "about",
    "after",
    "again",
    "could",
    "does",
    "from",
    "have",
    "into",
    "that",
    "their",
    "there",
    "these",
    "they",
    "this",
    "what",
    "when",
    "where",
    "which",
    "with",
    "would"
]);

const getTerms = (question: string) =>
    [...new Set(question.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) ?? [])]
        .filter((term) => !ignoredTerms.has(term))
        .slice(0, 12);

const scoreMemory = (title: string, content: string, terms: string[]) => {
    const normalizedTitle = title.toLowerCase();
    const normalizedContent = content.toLowerCase();

    return terms.reduce((score, term) => {
        if (normalizedTitle.includes(term)) {
            score += 3;
        }

        if (normalizedContent.includes(term)) {
            score += 1;
        }

        return score;
    }, 0);
};

export const findRelevantMemories = async (familyId: string, question: string) => {
    const terms = getTerms(question);

    if (terms.length === 0) {
        return [];
    }

    const candidates = await Memory.find({
        familyId,
        $or: terms.flatMap((term) => [
            { title: { $regex: escapeRegex(term), $options: "i" } },
            { content: { $regex: escapeRegex(term), $options: "i" } }
        ])
    })
        .sort({ updatedAt: -1 })
        .limit(100)
        .exec();

    return candidates
        .map((memory) => ({
            memory,
            score: scoreMemory(memory.title, memory.content, terms)
        }))
        .filter(({ score }) => score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 5)
        .map(({ memory }) => memory);
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
