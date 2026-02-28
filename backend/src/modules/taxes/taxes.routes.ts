import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import { z } from "zod";

const router = Router();
router.use(authenticate);

// List Tax Groups
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const taxGroups = await prisma.taxGroup.findMany({
      where: { businessId: user.businessId }
    });
    
    const formattedGroups = taxGroups.map(tg => {
      const comps = tg.components as any[];
      const totalRate = comps.reduce((sum, c) => sum + Number(c.rate), 0);
      const description = comps.map(c => `${c.name} @ ${c.rate}%`).join(" + ");
      return { ...tg, rate: totalRate, description };
    });
    
    res.json(formattedGroups);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const taxGroupSchema = z.object({
  name: z.string().min(2),
  components: z.array(z.object({
    name: z.string(),
    rate: z.number().nonnegative()
  })).min(1)
});

// Create Tax Group (e.g., GST 18%)
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = taxGroupSchema.parse(req.body);

    const taxGroup = await prisma.taxGroup.create({
      data: {
        businessId: user.businessId,
        name: data.name,
        components: data.components
      }
    });

    res.status(201).json(taxGroup);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
    res.status(500).json({ error: error.message });
  }
});

// Tax Calculation Engine API
// Realistically, the frontend will compute taxes for live preview, and the backend verifies on save.
// This endpoint provides tax calculation as a service if the frontend requests it explicitly.
router.post("/calculate", async (req: Request, res: Response) => {
  try {
    const { subtotal, stateSupply, items } = req.body;
    // stateSupply: "INTRA" | "INTER"
    
    // Simplistic GST Calc Engine
    let totalTax = 0;
    const itemTaxes = items.map((item: any) => {
      const taxable = item.qty * item.unitPrice - (item.discount || 0);
      let taxAmount = 0;

      if (item.taxGroup) {
        // Evaluate components dynamically
        for (const comp of item.taxGroup.components) {
          if (stateSupply === 'INTRA') {
            if (comp.name.includes("CGST") || comp.name.includes("SGST")) {
              taxAmount += (taxable * comp.rate) / 100;
            }
          } else if (stateSupply === 'INTER') {
            if (comp.name.includes("IGST")) {
              taxAmount += (taxable * comp.rate) / 100;
            }
          } else {
             taxAmount += (taxable * comp.rate) / 100;
          }
        }
      }
      totalTax += taxAmount;
      return { ...item, taxAmount };
    });

    res.json({ totalTax, items: itemTaxes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
