import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
    await mongoose.connect(env.DB_URL);
    console.log('Db connected successfully')
};