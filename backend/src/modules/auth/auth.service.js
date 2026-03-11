"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../../config/db"));
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const JWT_EXPIRES_IN = "7d";
const registerUser = async (data) => {
    // Check if user exists
    const existingUser = await db_1.default.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) {
        throw new Error("User with this email already exists");
    }
    // Hash password
    const salt = await bcryptjs_1.default.genSalt(10);
    const passwordHash = await bcryptjs_1.default.hash(data.password, salt);
    // Use a transaction since we create Business + User together
    const result = await db_1.default.$transaction(async (tx) => {
        // 1. Create Business
        const business = await tx.business.create({
            data: {
                name: data.businessName,
            }
        });
        // 2. Create User linked to Business
        const user = await tx.user.create({
            data: {
                businessId: business.id,
                name: data.name,
                email: data.email,
                passwordHash,
                role: "OWNER"
            }
        });
        return { user, business };
    });
    // Generate Token
    const token = jsonwebtoken_1.default.sign({ id: result.user.id, businessId: result.business.id, role: result.user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return {
        token,
        user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            businessId: result.business.id
        },
        business: result.business
    };
};
exports.registerUser = registerUser;
const loginUser = async (data) => {
    const user = await db_1.default.user.findUnique({
        where: { email: data.email },
        include: { business: true }
    });
    if (!user) {
        throw new Error("Invalid credentials");
    }
    const isMatch = await bcryptjs_1.default.compare(data.password, user.passwordHash);
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }
    // Update last active
    await db_1.default.user.update({
        where: { id: user.id },
        data: { lastActive: new Date() }
    });
    const token = jsonwebtoken_1.default.sign({ id: user.id, businessId: user.businessId, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            businessId: user.businessId
        },
        business: user.business
    };
};
exports.loginUser = loginUser;
const getUserProfile = async (userId) => {
    const user = await db_1.default.user.findUnique({
        where: { id: userId },
        include: { business: true }
    });
    if (!user) {
        throw new Error("User not found");
    }
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        business: user.business
    };
};
exports.getUserProfile = getUserProfile;
//# sourceMappingURL=auth.service.js.map