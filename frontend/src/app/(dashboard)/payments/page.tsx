"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import { toast } from "sonner";

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // For recording a new payment
  const [formData, setFormData] = useState({
    partyId: "",
    amount: 0,
    type: "IN",
    method: "CASH",
    reference: "",
    notes: ""
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => await apiClient.get('/payments')
  });

  const { data: parties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => await apiClient.get('/parties')
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => await apiClient.get('/invoices')
  });

  const recordPayment = useMutation({
    mutationFn: (newPayment: any) => apiClient.post("/payments", newPayment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsDialogOpen(false);
      toast.success("Payment recorded successfully");
      setFormData({ partyId: "", amount: 0, type: "IN", method: "CASH", reference: "", notes: "", invoiceId: "" } as any);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record payment");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordPayment.mutate({
      partyId: formData.partyId,
      amount: Number(formData.amount),
      mode: formData.method,
      date: dayjs().toISOString(),
      reference: formData.reference,
      notes: formData.notes,
      invoiceId: (formData as any).invoiceId || undefined
    });
  };

  const filteredPayments = payments?.filter((p: any) => 
    p.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.party?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Receipts</h1>
          <p className="text-muted-foreground mt-1">
            Track money coming in and going out
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>
                Log a receipt from a customer or payment to a supplier.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Payment Type *</Label>
                <div className="flex gap-4">
                  <Button 
                    type="button" 
                    variant={formData.type === 'IN' ? 'default' : 'outline'}
                    className={formData.type === 'IN' ? 'bg-green-600 hover:bg-green-700 w-full' : 'w-full'}
                    onClick={() => setFormData({...formData, type: 'IN'})}
                  >
                    <ArrowDownLeft className="mr-2 h-4 w-4" /> Receipt In
                  </Button>
                  <Button 
                    type="button" 
                    variant={formData.type === 'OUT' ? 'default' : 'outline'}
                    className={formData.type === 'OUT' ? 'bg-destructive hover:bg-destructive/90 w-full' : 'w-full'}
                    onClick={() => setFormData({...formData, type: 'OUT'})}
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" /> Payment Out
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="party">Party (Customer/Supplier) *</Label>
                <Select value={formData.partyId} onValueChange={(val) => setFormData({...formData, partyId: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Party" />
                  </SelectTrigger>
                  <SelectContent>
                    {parties?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'IN' && formData.partyId && (
                <div className="space-y-2">
                  <Label htmlFor="invoice">Link to Invoice (Optional)</Label>
                  <Select 
                    value={(formData as any).invoiceId || "unlinked"} 
                    onValueChange={(val) => setFormData({...formData, invoiceId: val === "unlinked" ? "" : val} as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an Invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlinked">-- Do not link --</SelectItem>
                      {invoices?.filter((inv: any) => inv.partyId === formData.partyId && ['SENT', 'PARTIAL', 'OVERDUE'].includes(inv.status)).map((inv: any) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.number} (₹{Number(inv.total).toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <AmountInput 
                    id="amount" 
                    step="0.01" required min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="method">Method</Label>
                  <Select value={formData.method} onValueChange={(val) => setFormData({...formData, method: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="NEFT_RTGS">Bank Transfer (NEFT/RTGS/IMPS)</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference / UTR No.</Label>
                <Input 
                  id="reference" 
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={recordPayment.isPending}>
                  {recordPayment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Payment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search receipts..." 
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
              <TableHead>Receipt No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Party Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading payments...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No payment records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.number}
                  </TableCell>
                  <TableCell>
                    {dayjs(p.date).format("MMM DD, YYYY")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.party?.name || "Unknown Party"}</div>
                  </TableCell>
                  <TableCell>
                    {p.type === 'IN' ? (
                      <Badge className="bg-green-600/10 text-green-600 hover:bg-green-600/20 shadow-none border-transparent">
                        <ArrowDownLeft className="mr-1 h-3 w-3" /> Received
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-none border-transparent">
                        <ArrowUpRight className="mr-1 h-3 w-3" /> Paid Out
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={p.type === 'IN' ? "text-green-600" : ""}>
                      {p.type === 'IN' ? '+' : '-'} ₹{Number(p.amount).toFixed(2)}
                    </span>
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
