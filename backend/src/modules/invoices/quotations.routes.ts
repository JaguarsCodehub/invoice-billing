import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth";
import prisma from "../../config/db";
import { z } from "zod";

const router = Router();
router.use(authenticate);

const quoteItemSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string(),
  qty: z.number().positive(),
  unit: z.string().default("PCS"),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  taxAmount: z.number().nonnegative().default(0),
});

const quotationSchema = z.object({
  partyId: z.string(),
  number: z.string(),
  date: z.string(),
  validUntil: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "INVOICED"]).default("DRAFT"),
  discount: z.number().default(0),
  notes: z.string().optional().nullable(),
  items: z.array(quoteItemSchema).min(1),
});

// Create Quotation
router.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = quotationSchema.parse(req.body);

    let subtotal = 0;
    let taxAmount = 0;

    const computedItems = data.items.map(item => {
      const itemTotal = (item.qty * item.unitPrice) - item.discount + item.taxAmount;
      subtotal += (item.qty * item.unitPrice) - item.discount;
      taxAmount += item.taxAmount;
      return { ...item, total: itemTotal };
    });

    const total = subtotal + taxAmount - data.discount;

    const quotation = await prisma.quotation.create({
      data: {
        businessId: user.businessId,
        partyId: data.partyId,
        number: data.number,
        date: new Date(data.date),
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        status: data.status as any,
        subtotal,
        taxAmount,
        discount: data.discount,
        total,
        notes: data.notes,
        items: {
          create: computedItems
        }
      },
      include: { items: true }
    });

    res.status(201).json(quotation);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: (error as any).errors });
    res.status(500).json({ error: error.message });
  }
});

// Get Quotations
router.get("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const { status, partyId } = req.query;

    const quotations = await prisma.quotation.findMany({
      where: { 
        businessId: user.businessId,
        ...(status ? { status: status as any } : {}),
        ...(partyId ? { partyId: partyId as string } : {})
      },
      // Removed include party since it's not directly related in schema unless defined
      orderBy: { date: "desc" }
    });

    res.json(quotations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Convert to Invoice
router.post("/:id/convert-to-invoice", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const quote = await prisma.quotation.findFirst({
      where: { id: req.params.id as string, businessId: user.businessId },
      include: { items: true }
    });

    if (!quote) return res.status(404).json({ error: "Quotation not found" });

    // In a real flow, this just returns the invoice shape for the frontend builder, 
    // but here we can just create the invoice directly as DRAFT.
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
         data: {
           businessId: user.businessId,
           partyId: quote.partyId,
           type: "TAX_INVOICE",
           number: `INV-${quote.number}`, // Just string manipulation for demo
           date: new Date(),
           status: "DRAFT",
           subtotal: quote.subtotal,
           taxAmount: quote.taxAmount,
           discount: quote.discount,
           total: quote.total,
           notes: quote.notes,
           items: {
             create: (quote as any).items.map((i: any) => ({
               productId: i.productId,
               description: i.description,
               qty: i.qty,
               unit: i.unit,
               unitPrice: i.unitPrice,
               discount: i.discount,
               taxAmount: i.taxAmount,
               total: i.total
             }))
           }
         }
      });
      
      await tx.quotation.update({
        where: { id: quote.id },
        data: { status: "ACCEPTED" }
      });

      return invoice;
    });

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
