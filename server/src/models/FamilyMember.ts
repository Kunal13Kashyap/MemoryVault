import mongoose, { Schema } from "mongoose";

const familyMemberSchema = new Schema(
    {
        familyId: { type: Schema.Types.ObjectId, ref: "Family", required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 100 },
        relation: { type: String, trim: true, maxlength: 80, default: "" },
        avatarUrl: { type: String, trim: true, maxlength: 2048, default: "" }
    },
    { timestamps: true }
);

export const FamilyMember = mongoose.model("FamilyMember", familyMemberSchema);
