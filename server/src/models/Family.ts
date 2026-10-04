import mongoose, { Schema } from "mongoose";

const familySchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
    },
    { timestamps: true }
);

export const Family = mongoose.model("Family", familySchema);
