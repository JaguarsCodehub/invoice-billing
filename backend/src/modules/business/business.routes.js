"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const db_1 = __importDefault(require("../../config/db"));
const router = (0, express_1.Router)();
// Apply auth middleware to all business routes
router.use(auth_1.authenticate);
// Get current business details
router.get("/", async (req, res) => {
    try {
        const user = req.user;
        const business = await db_1.default.business.findUnique({
            where: { id: user.businessId }
        });
        if (!business)
            return res.status(404).json({ error: "Business not found" });
        res.json(business);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Update current business details
router.patch("/", async (req, res) => {
    try {
        const user = req.user;
        // Only owners/admins can update business profile
        if (user.role !== "OWNER" && user.role !== "ADMIN") {
            return res.status(403).json({ error: "Forbidden" });
        }
        const { name, gstin, address, currency, timezone, taxConfig } = req.body;
        const business = await db_1.default.business.update({
            where: { id: user.businessId },
            data: {
                ...(name && { name }),
                ...(gstin !== undefined && { gstin }),
                ...(address !== undefined && { address }),
                ...(currency && { currency }),
                ...(timezone && { timezone }),
                ...(taxConfig && { taxConfig }),
            }
        });
        res.json(business);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=business.routes.js.map