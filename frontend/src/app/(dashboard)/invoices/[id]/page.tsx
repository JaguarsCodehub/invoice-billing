"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Printer, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";

export default function ViewInvoicePage({ params }: { params: { id: string } }) {
  const invoiceId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get('print') === 'true';

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => await apiClient.get(`/invoices/${invoiceId}`)
  });

  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: async () => await apiClient.get('/business')
  });

  // Helper to convert number to words (simple version)
  const numberToWords = (num: number) => {
    return `Rupees ${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Only`;
  };

  useEffect(() => {
    if (autoPrint && invoice) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [autoPrint, invoice]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center p-12">Invoice not found.</div>;
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12 print:p-0 print:m-0 print:w-full print:max-w-full">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Invoice {invoice.number}</h1>
            <Badge variant="outline" className="mt-1">{invoice.status}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
            Edit Invoice
          </Button>
        </div>
      </div>

      <div className="bg-white text-black font-sans shadow-sm print:shadow-none print:border-none w-full max-w-[800px] print:w-[800px] print:max-w-[800px] mx-auto min-h-[11.23in] flex flex-col p-6 border border-gray-200" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>
        {/* Template Header */}
        <div className="flex border border-black min-h-[100px]">
          <div className="flex-1 p-3 border-r border-black flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold uppercase leading-tight line-clamp-1">{business?.name || "COMPANY NAME"}</h2>
              <p className="text-[11px] mt-0.5 leading-tight line-clamp-2">{business?.address || "Address details would go here."}</p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-auto text-[10px]">
              <p><span className="font-semibold">Phone No.:</span> {business?.phone || ""}</p>
              <p><span className="font-semibold">Email ID:</span> {business?.email || ""}</p>
              <p><span className="font-semibold">GSTIN No.:</span> {business?.gstin || ""}</p>
              <p><span className="font-semibold">State:</span> Maharashtra</p>
            </div>
          </div>
        </div>

        {/* Title Bar */}
        <div className="bg-zinc-300 py-1 text-center font-bold text-sm border-x border-b border-black uppercase tracking-widest">
          {(invoice.type || "TAX INVOICE").replace("_", " ")}
        </div>

        {/* Details Section */}
        <div className="flex border-x border-b border-black text-[11px]">
          <div className="flex-1 border-r border-black p-2 flex flex-col gap-1">
            <span className="font-bold underline mb-1 uppercase text-[10px] text-zinc-600">Bill Details</span>
            <p><span className="font-semibold">Party Name:</span> {invoice.party?.name || ""}</p>
            <p><span className="font-semibold">Address:</span> {invoice.party?.address || ""}</p>
            <p><span className="font-semibold">Phone No.:</span> {invoice.party?.phone || ""}</p>
            <p><span className="font-semibold">Email ID:</span> {invoice.party?.email || ""}</p>
            <p><span className="font-semibold">GSTIN No.:</span> {invoice.party?.gstin || ""}</p>
            <p><span className="font-semibold">State:</span> Maharashtra</p>
          </div>
          <div className="w-64 p-2 flex flex-col gap-1">
            <span className="font-bold underline mb-1 uppercase text-[10px] text-zinc-600">Invoice Details</span>
            <p><span className="font-semibold">Invoice No.:</span> {invoice.number}</p>
            <p><span className="font-semibold">Invoice Date:</span> {dayjs(invoice.date).format("DD/MM/YYYY")}</p>
            <p><span className="font-semibold">Time:</span> {invoice.time || "N/A"}</p>
            <p><span className="font-semibold">Place of Supply:</span> {invoice.placeOfSupply || ""}</p>
            <p><span className="font-semibold">PO Date:</span> {invoice.poDate ? dayjs(invoice.poDate).format("DD/MM/YYYY") : ""}</p>
            <p><span className="font-semibold">PO Number:</span> {invoice.poNumber || ""}</p>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_80px_50px_40px_70px_60px_60px_70px_90px] border-x border-b border-black bg-zinc-100 font-bold text-[10px] text-center min-h-[40px] items-center uppercase">
          <div className="border-r border-black p-1 h-full flex items-center justify-center text-zinc-600">SL.<br/>No.</div>
          <div className="border-r border-black p-1 h-full flex items-center justify-center text-left px-2">Item Name</div>
          <div className="border-r border-black p-1 h-full flex items-center justify-center">HSN/SAC</div>
          <div className="border-r border-black p-1 h-full flex items-center justify-center">QTY</div>
          <div className="border-r border-black p-1 h-full flex items-center justify-center">Unit</div>
          <div className="border-r border-black p-1 h-full flex items-center justify-center">Price/Unit</div>
          <div className="border-r border-black p-1 h-full flex items-center justify-center">Disc</div>
          <div className="border-r border-black p-1 h-full flex items-center justify-center">GST<br/>Rate</div>
          <div className="border-r border-black p-1 h-full flex items-center justify-center">GST<br/>Amt</div>
          <div className="p-1 h-full flex items-center justify-center">Amount</div>
        </div>

        {/* Table Rows */}
        <div className="flex-1 border-x border-black overflow-hidden flex flex-col relative">
          {invoice.items?.map((item: any, i: number) => {
            const qty = Number(item.qty);
            const unitPrice = Number(item.unitPrice);
            const discount = Number(item.discount || 0);
            const taxAmount = Number(item.taxAmount || 0);
            const taxableAmount = (qty * unitPrice) - discount;
            const taxPercent = taxableAmount > 0 ? Math.round((taxAmount / taxableAmount) * 100) : 0;
            const amount = taxableAmount + taxAmount;

            return (
              <div key={item.id || i} className="grid grid-cols-[40px_1fr_80px_50px_40px_70px_60px_60px_70px_90px] border-b border-zinc-100 text-[10px] min-h-[32px] items-center text-center">
                <div className="border-r border-black h-full py-2 bg-zinc-50/30 text-zinc-500">{i + 1}</div>
                <div className="border-r border-black h-full py-2 text-left px-2">
                  <span className="font-semibold block truncate leading-tight uppercase text-zinc-800">{item.description}</span>
                </div>
                <div className="border-r border-black h-full py-2">{item.hsnSac || ""}</div>
                <div className="border-r border-black h-full py-2 font-medium">{qty}</div>
                <div className="border-r border-black h-full py-2 uppercase text-zinc-500">{item.unit || "PCS"}</div>
                <div className="border-r border-black h-full py-2">{unitPrice.toFixed(2)}</div>
                <div className="border-r border-black h-full py-2 text-zinc-600">{discount.toFixed(2)}</div>
                <div className="border-r border-black h-full py-2">{taxPercent}%</div>
                <div className="border-r border-black h-full py-2">{taxAmount.toFixed(2)}</div>
                <div className="h-full py-2 text-right px-2 font-bold bg-zinc-50/20">{amount.toFixed(2)}</div>
              </div>
            );
          })}
          {/* Fill remaining space with vertical lines */}
          <div className="absolute inset-0 z-[-1] flex">
            <div className="w-[40px] border-r border-black h-full bg-zinc-50/10"></div>
            <div className="flex-1 border-r border-black h-full"></div>
            <div className="w-[80px] border-r border-black h-full"></div>
            <div className="w-[50px] border-r border-black h-full bg-zinc-50/10"></div>
            <div className="w-[40px] border-r border-black h-full"></div>
            <div className="w-[70px] border-r border-black h-full"></div>
            <div className="w-[60px] border-r border-black h-full bg-zinc-50/10"></div>
            <div className="w-[60px] border-r border-black h-full"></div>
            <div className="w-[70px] border-r border-black h-full bg-zinc-50/10"></div>
            <div className="w-[90px] h-full"></div>
          </div>
        </div>

        {/* Total Row */}
        <div className="grid grid-cols-[40px_1fr_80px] border border-black font-bold text-[11px] items-center text-center bg-zinc-50">
          <div className="border-r border-black p-1 h-full bg-zinc-100"></div>
          <div className="border-r border-black p-1 text-left px-2">Total</div>
          <div className="p-1 px-2 text-right pr-2">₹{Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        {/* Footer Summary */}
        <div className="flex border-x border-b border-black text-[10px] min-h-[140px]">
          <div className="flex-1 flex flex-col border-r border-black divide-y divide-black">
            <div className="p-2 min-h-[50px]">
              <span className="font-bold underline uppercase text-[9px] text-zinc-600 block mb-1">Description:</span>
              <p className="whitespace-pre-wrap leading-tight">{invoice.notes || ""}</p>
            </div>
            <div className="p-2 min-h-[30px] bg-zinc-100">
                <span className="font-bold uppercase text-[9px] text-zinc-600">Invoice Amount In Words:</span>
                <p className="font-semibold italic mt-1">{numberToWords(Number(invoice.total || 0))}</p>
            </div>
            <div className="p-2 flex-1">
              <span className="font-bold underline uppercase text-[9px] text-zinc-600 block mb-1">Terms and Conditions:</span>
              <p className="whitespace-pre-wrap leading-tight text-[9px]">{invoice.termsAndConditions || ""}</p>
            </div>
          </div>
          <div className="w-56 flex flex-col divide-y divide-black font-semibold">
            <div className="flex justify-between p-2">
              <span>Sub Total</span>
              <span>₹{Number(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2">
              <span>Tax Amount</span>
              <span>₹{Number(invoice.taxAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2">
              <span>Discount</span>
              <span>-₹{Number(invoice.discount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 bg-zinc-300 text-sm font-bold border-y border-black self-end w-full">
              <span>Total Amount</span>
              <span>₹{Number(invoice.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Powered By */}
        <div className="mt-auto pt-6 flex justify-end">
          <div className="flex flex-col items-end opacity-70 scale-90 origin-right">
            <span className="text-[10px] font-bold text-zinc-400 mb-[-4px]">Powered by</span>
            <span className="text-xl font-black italic tracking-tighter">
              <span className="text-zinc-600 font-bold">BillFlow</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
