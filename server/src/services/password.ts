import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";

const saltSize = 16;
const keySize = 64;

const scrypt = (password: string, salt: Buffer) =>
    new Promise<Buffer>((resolve, reject) => {
        scryptCallback(password, salt, keySize, (error, key) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(key);
        });
    });

export const hashPassword = async (password: string) => {
    const salt = randomBytes(saltSize);
    const key = await scrypt(password, salt);
    return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
};

export const verifyPassword = async (password: string, storedHash: string) => {
    const [algorithm, saltHex, keyHex] = storedHash.split("$");

    if (algorithm !== "scrypt" || !saltHex || !keyHex) {
        throw new Error("Stored password hash has an invalid format");
    }

    const salt = Buffer.from(saltHex, "hex");
    const expectedKey = Buffer.from(keyHex, "hex");

    if (salt.length !== saltSize || expectedKey.length !== keySize) {
        throw new Error("Stored password hash has an invalid format");
    }

    const actualKey = await scrypt(password, salt);
    return timingSafeEqual(actualKey, expectedKey);
};
