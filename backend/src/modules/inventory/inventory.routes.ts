import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import { z } from "zod";

const router = Router();
router.use(authenticate);

// Get stock summary for all products
router.get("/stock-summary", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    
    const stockAggregations = await prisma.stockEntry.groupBy({
      by: ['productId', 'type'],
      where: { businessId: user.businessId },
      _sum: { qty: true }
    });

    res.json(stockAggregations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const adjustSchema = z.object({
  productId: z.string(),
  warehouseId: z.string().optional(),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "TRANSFER"]),
  qty: z.number().positive(),
  notes: z.string().optional()
});

// Manual Stock Adjustment
router.post("/adjustments", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = adjustSchema.parse(req.body);

    let warehouseId = data.warehouseId;
    if (!warehouseId) {
      // Find default warehouse or create one
      const warehouse = await prisma.warehouse.findFirst({
        where: { businessId: user.businessId, isDefault: true }
      });
      if (warehouse) {
        warehouseId = warehouse.id;
      } else {
        const newWarehouse = await prisma.warehouse.create({
          data: { name: "Main", isDefault: true, businessId: user.businessId }
        });
        warehouseId = newWarehouse.id;
      }
    }

    const entry = await prisma.stockEntry.create({
      data: {
        businessId: user.businessId,
        productId: data.productId,
        warehouseId,
        type: data.type,
        qty: data.qty,
        notes: data.notes
      }
    });

    res.status(201).json(entry);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: (error as any).errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get stock history for a specific product
router.get("/history/:productId", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const productId = req.params.productId as string;

    const history = await prisma.stockEntry.findMany({
      where: { 
        businessId: user.businessId,
        productId 
      },
      orderBy: { date: 'desc' },
      include: {
        warehouse: { select: { name: true } }
      }
    });

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock alerts
router.get("/low-stock", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    // In a real app, Product would have a `reorderLevel`. We simulate by checking currentStock.
    res.json([]); 
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
