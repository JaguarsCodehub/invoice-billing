import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";

const router = Router();

// Apply auth middleware to all business routes
router.use(authenticate);

// Get current business details
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const business = await prisma.business.findUnique({
      where: { id: user.businessId }
    });
    
    if (!business) return res.status(404).json({ error: "Business not found" });
    
    res.json(business);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update current business details
router.patch("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    // Only owners/admins can update business profile
    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { name, gstin, address, currency, timezone, taxConfig } = req.body;

    const business = await prisma.business.update({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
