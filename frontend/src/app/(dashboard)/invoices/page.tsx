"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Loader2, MoreVertical, FileText, Download, Printer, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";

export default function InvoicesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => await apiClient.get('/invoices')
  });

  const filteredInvoices = invoices?.filter((inv: any) => 
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.party?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PAID': return <Badge className="bg-green-600">Paid</Badge>;
      case 'PARTIAL': return <Badge variant="secondary" className="text-orange-600">Partial</Badge>;
      case 'OVERDUE': return <Badge variant="destructive">Overdue</Badge>;
      case 'DRAFT': return <Badge variant="outline">Draft</Badge>;
      case 'SENT': return <Badge variant="default" className="bg-blue-600">Sent</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your sales invoices
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search invoices or parties..." 
            className="pl-8 bg-background border-border/50 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading invoices...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No invoices found. Create your first invoice!
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-primary">
                    {inv.number}
                  </TableCell>
                  <TableCell>
                    {dayjs(inv.date).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{inv.party?.name || "Unknown Party"}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(inv.status)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{Number(inv.total).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(inv.number)}>
                          Copy Invoice Number
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push(`/invoices/${inv.id}`)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/invoices/${inv.id}/edit`)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {/* Download & Print functionality would be handled by the View page or an API endpoint */}
                        <DropdownMenuItem onClick={() => router.push(`/invoices/${inv.id}?print=true`)}>
                          <Printer className="mr-2 h-4 w-4" />
                          Print
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
