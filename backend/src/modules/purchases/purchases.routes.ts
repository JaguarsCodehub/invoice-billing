import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const purchaseItemSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string(),
  qty: z.number().positive(),
  unit: z.string().default("PCS"),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
});

const purchaseOrderSchema = z.object({
  partyId: z.string(),
  number: z.string(),
  date: z.string(),
  status: z.enum(["DRAFT", "SENT", "CONFIRMED", "RECEIVED", "CANCELLED"]).default("DRAFT"),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1),
});

const purchaseInvoiceSchema = z.object({
  partyId: z.string(),
  poId: z.string().optional().nullable(),
  number: z.string(),
  date: z.string(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "RECEIVED", "PARTIAL", "PAID", "OVERDUE"]).default("DRAFT"),
  discount: z.number().default(0),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1),
});

// Create Purchase Order
router.post("/orders", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = purchaseOrderSchema.parse(req.body);

    let subtotal = 0;
    let taxAmount = 0;

    const computedItems = data.items.map(item => {
      const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
      subtotal += (item.qty * item.unitPrice) - item.discount;
      taxAmount += item.taxAmount;
      return { ...item, total: itemTotal };
    });

    const total = subtotal + taxAmount;

    const po = await prisma.purchaseOrder.create({
      data: {
        businessId: user.businessId,
        partyId: data.partyId,
        number: data.number,
        date: new Date(data.date),
        status: data.status,
        subtotal,
        taxAmount,
        total,
        notes: data.notes,
        items: {
          create: computedItems
        }
      },
      include: { items: true, party: true }
    });

    res.status(201).json(po);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
    res.status(500).json({ error: error.message });
  }
});

// Create Purchase Invoice (Bill)
router.post("/invoices", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = purchaseInvoiceSchema.parse(req.body);

    let subtotal = 0;
    let taxAmount = 0;

    const computedItems = data.items.map(item => {
      const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
      subtotal += (item.qty * item.unitPrice) - item.discount;
      taxAmount += item.taxAmount;
      return { ...item, total: itemTotal };
    });

    const total = subtotal + taxAmount - data.discount;

    // Transaction to create bill and add stock
    const result = await prisma.$transaction(async (tx) => {
      const bill = await tx.purchaseInvoice.create({
        data: {
          businessId: user.businessId,
          partyId: data.partyId,
          poId: data.poId,
          number: data.number,
          date: new Date(data.date),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          status: data.status,
          subtotal,
          taxAmount,
          discount: data.discount,
          total,
          notes: data.notes,
          items: {
            create: computedItems
          }
        },
        include: { items: true, party: true }
      });

      // If RECEIVED/PARTIAL/PAID, add stock
      if (['RECEIVED', 'PARTIAL', 'PAID'].includes(data.status)) {
        const warehouse = await tx.warehouse.findFirst({
          where: { businessId: user.businessId, isDefault: true }
        }) || await tx.warehouse.create({
            data: { name: "Main", isDefault: true, businessId: user.businessId }
        });

        for (const item of computedItems) {
          if (item.productId) {
            await tx.stockEntry.create({
              data: {
                businessId: user.businessId,
                productId: item.productId,
                warehouseId: warehouse.id,
                type: "IN",
                qty: item.qty,
                cost: item.unitPrice,
                reference: bill.number,
                notes: `Purchased via Bill ${bill.number}`
              }
            });
            // Update purchase price in product master
            await tx.product.update({
              where: { id: item.productId },
              data: { purchasePrice: item.unitPrice }
            });
          }
        }
      }

      return bill;
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
    res.status(500).json({ error: error.message });
  }
});

// Get all Purchase Invoices
router.get("/invoices", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { status, partyId } = req.query;

    const bills = await prisma.purchaseInvoice.findMany({
      where: { 
        businessId: user.businessId,
        ...(status ? { status: status as any } : {}),
        ...(partyId ? { partyId: typeof partyId === 'string' ? partyId : (partyId as string[])[0] } : {})
      },
      include: {
        party: { select: { name: true, type: true } }
      },
      orderBy: { date: "desc" }
    });

    res.json(bills);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Purchase Invoice by ID
router.get("/invoices/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const bill = await prisma.purchaseInvoice.findFirst({
      where: { id: req.params.id as string, businessId: user.businessId },
      include: { 
        items: true,
        party: true
      }
    });

    if (!bill) return res.status(404).json({ error: "Purchase Bill not found" });
    res.json(bill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Purchase Invoice
router.put("/invoices/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { id } = req.params;
    const data = purchaseInvoiceSchema.parse(req.body);

    const existing = await prisma.purchaseInvoice.findFirst({
      where: { id: id as string, businessId: user.businessId }
    });

    if (!existing) return res.status(404).json({ error: "Purchase Bill not found" });

    let subtotal = 0;
    let taxAmount = 0;

    const computedItems = data.items.map((item: any) => {
      const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
      subtotal += (item.qty * item.unitPrice) - item.discount;
      taxAmount += item.taxAmount;
      return { ...item, total: itemTotal };
    });

    const total = subtotal + taxAmount - data.discount;

    const result = await prisma.$transaction(async (tx: any) => {
      // Delete old items
      await tx.purchaseItem.deleteMany({
        where: { purchaseInvoiceId: id as string }
      });

      // Update bill and create new items
      const updated = await tx.purchaseInvoice.update({
        where: { id: id as string },
        data: {
          partyId: data.partyId,
          poId: data.poId,
          number: data.number,
          date: new Date(data.date),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          status: data.status,
          subtotal,
          taxAmount,
          discount: data.discount,
          total,
          notes: data.notes,
          items: {
            create: computedItems
          }
        },
        include: { items: true, party: true }
      });

      return updated;
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
    res.status(500).json({ error: error.message });
  }
});

export default router;
