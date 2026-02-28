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
import { Plus, Search, Loader2, MoreVertical, FileSignature, CopyCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";

export default function QuotationsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: quotations, isLoading } = useQuery({
    queryKey: ['quotations'],
    queryFn: async () => await apiClient.get('/quotations')
  });

  const filteredQuotations = quotations?.filter((q: any) => 
    q.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.party?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ACCEPTED': return <Badge className="bg-green-600">Accepted</Badge>;
      case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
      case 'DRAFT': return <Badge variant="outline">Draft</Badge>;
      case 'SENT': return <Badge variant="default" className="bg-blue-600">Sent</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotations / Estimates</h1>
          <p className="text-muted-foreground mt-1">
            Create and track job estimates and quotes
          </p>
        </div>
        <Link href="/quotations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Quote
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search quotes or parties..." 
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
              <TableHead>Quote No</TableHead>
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
                    Loading quotations...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No quotations found. Create your first quote!
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotations.map((q: any) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium text-primary">
                    {q.number}
                  </TableCell>
                  <TableCell>
                    {dayjs(q.date).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{q.party?.name || "Unknown Party"}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(q.status)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{Number(q.total).toFixed(2)}
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
                        <DropdownMenuItem>
                          <FileSignature className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={q.status === 'ACCEPTED'}>
                          <CopyCheck className="mr-2 h-4 w-4" />
                          Convert to Invoice
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
