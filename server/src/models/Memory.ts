import mongoose, { Schema } from "mongoose";

export const memoryTypes = ["recipe", "story", "note", "document", "photo"] as const;

const memorySchema = new Schema(
    {
        familyId: { type: Schema.Types.ObjectId, ref: "Family", required: true, index: true },
        memberIds: [{ type: Schema.Types.ObjectId, ref: "FamilyMember" }],
        memberId: { type: Schema.Types.ObjectId, ref: "FamilyMember", default: null },
        isUserAssociated: { type: Boolean, default: false },
        title: { type: String, required: true, trim: true, maxlength: 160 },
        content: {
            type: String,
            required: function (this: { type?: string }) {
                return this.type !== "document" && this.type !== "photo";
            },
            default: "",
            trim: true,
            maxlength: 20000
        },
        type: { type: String, enum: memoryTypes, required: true },
        attachment: {
            type: new Schema(
                {
                    storageKey: { type: String, required: true },
                    fileName: { type: String, required: true },
                    contentType: { type: String, required: true },
                    size: { type: Number, required: true }
                },
                { _id: false }
            ),
            default: undefined
        }
    },
    { timestamps: true }
);

export const Memory = mongoose.model("Memory", memorySchema);
