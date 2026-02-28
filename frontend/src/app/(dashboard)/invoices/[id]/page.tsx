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

      <div className="bg-white text-black p-10 rounded-lg shadow-sm print:shadow-none print:p-0 border border-gray-200 print:border-none min-h-[1056px]">
        <div className="flex justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-wider">INVOICE</h2>
            <div className="mt-2 text-gray-500 text-sm">
              <p>Invoice # {invoice.number}</p>
              <p>Date: {dayjs(invoice.date).format("MMM DD, YYYY")}</p>
              {invoice.dueDate && <p>Due Date: {dayjs(invoice.dueDate).format("MMM DD, YYYY")}</p>}
            </div>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-lg text-gray-800">Your Company Name</h3>
            <p className="text-gray-500 text-sm mt-1">
              123 Business Street<br/>
              City, State, 12345<br/>
              contact@company.com
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h4>
          <div className="text-gray-800">
            <p className="font-bold">{invoice.party?.name}</p>
            {invoice.party?.email && <p className="text-sm">{invoice.party.email}</p>}
            {invoice.party?.phone && <p className="text-sm">{invoice.party.phone}</p>}
          </div>
        </div>

        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-600">
              <th className="py-3 font-semibold">Description</th>
              <th className="py-3 font-semibold text-center w-24">Qty</th>
              <th className="py-3 font-semibold text-right w-32">Rate</th>
              <th className="py-3 font-semibold text-right w-24">Tax</th>
              <th className="py-3 font-semibold text-right w-32">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any) => {
              const itemTotal = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discount || 0) + Number(item.taxAmount || 0);
              return (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-3">
                    <p className="font-medium text-gray-800">{item.description}</p>
                    {Number(item.discount) > 0 && <p className="text-xs text-gray-500">Includes ₹{item.discount} discount</p>}
                  </td>
                  <td className="py-3 text-center text-gray-800">{item.qty} {item.unit}</td>
                  <td className="py-3 text-right text-gray-800">₹{Number(item.unitPrice).toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-800">₹{Number(item.taxAmount).toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-800 font-medium">₹{itemTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end pt-4">
          <div className="w-1/2">
            <div className="flex justify-between py-2 text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₹{Number(invoice.subtotal).toFixed(2)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between py-2 text-sm text-gray-600">
                <span>Global Discount</span>
                <span>-₹{Number(invoice.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200 pb-4">
              <span>Tax</span>
              <span>₹{Number(invoice.taxAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-4 font-bold text-lg text-gray-800">
              <span>Total</span>
              <span>₹{Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notes</h4>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
