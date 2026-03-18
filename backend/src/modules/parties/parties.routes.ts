import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import { z } from "zod";
import { recordLedgerEntry } from "../../utils/party";

const router = Router();
router.use(authenticate);

const partySchema = z.object({
  name: z.string().min(2),
  type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH"]),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  creditLimit: z.number().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  openingBalance: z.number().optional().default(0),
});

// Create Party
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = partySchema.parse(req.body);

    const party = await prisma.$transaction(async (tx) => {
      const p = await tx.party.create({
        data: {
          ...data,
          businessId: user.businessId,
          // outstanding will be updated by recordLedgerEntry
        }
      });

      // Create initial ledger entry
      await recordLedgerEntry({
        businessId: user.businessId,
        partyId: p.id,
        type: "OPENING_BALANCE",
        amount: data.openingBalance,
        notes: "Initial balance",
        tx,
      });

      return p;
    });
    
    res.status(201).json(party);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get all parties
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { type } = req.query; // ?type=CUSTOMER
    
    const parties = await prisma.party.findMany({
      where: { 
        businessId: user.businessId,
        ...(type ? { type: type as any } : {})
      },
      orderBy: { createdAt: "desc" }
    });
    
    res.json(parties);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get party by ID
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const party = await prisma.party.findFirst({
      where: { id: req.params.id as string, businessId: user.businessId }
    });
    
    if (!party) return res.status(404).json({ error: "Party not found" });
    res.json(party);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update party
router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = partySchema.partial().parse(req.body);

    const party = await prisma.party.update({
      where: { id: req.params.id as string, businessId: user.businessId },
      data
    });
    
    res.json(party);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete party
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    await prisma.party.delete({
      where: { id: req.params.id as string, businessId: user.businessId }
    });
    res.json({ message: "Party deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: "Cannot delete party with existing transactions" });
  }
});

// Get party history (ledger)
router.get("/:id/history", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const history = await prisma.partyLedger.findMany({
      where: { 
        partyId: req.params.id as string, 
        businessId: user.businessId 
      },
      orderBy: { createdAt: "desc" }
    });
    
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
