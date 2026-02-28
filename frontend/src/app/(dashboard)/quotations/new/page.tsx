"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Trash2, Plus, Loader2, ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import dayjs from "dayjs";

export default function CreateQuotationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: parties } = useQuery({ queryKey: ['parties'], queryFn: async () => await apiClient.get('/parties') });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: async () => await apiClient.get('/products') });
  const { data: taxes } = useQuery({ queryKey: ['taxes'], queryFn: async () => await apiClient.get('/taxes') });

  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerData, setCustomerData] = useState({ name: "", email: "", phone: "", type: "CUSTOMER" });

  const [formData, setFormData] = useState({
    partyId: "",
    number: `EST-${Date.now().toString().slice(-6)}`,
    date: dayjs().format("YYYY-MM-DD"),
    expiryDate: dayjs().add(15, 'day').format("YYYY-MM-DD"),
    status: "DRAFT",
    discount: 0,
    notes: "Estimate valid for 15 days.",
  });

  const [items, setItems] = useState([
    { productId: "custom", description: "", qty: 1, unit: "PCS", unitPrice: 0, taxPercent: 0, discount: 0 }
  ]);

  const createQuotation = useMutation({
    mutationFn: (newQuote: any) => apiClient.post("/quotations", newQuote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success("Quotation created successfully");
      router.push("/quotations");
    },
    onError: (error: any) => {
      const msg = Array.isArray(error?.error) ? error.error[0]?.message : error?.error || "Failed to create quotation";
      toast.error(msg);
    }
  });

  const createParty = useMutation({
    mutationFn: (newParty: any) => apiClient.post("/parties", newParty),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success("Customer added successfully");
      setFormData({ ...formData, partyId: data.id });
      setIsCustomerOpen(false);
      setCustomerData({ name: "", email: "", phone: "", type: "CUSTOMER" });
    },
    onError: () => toast.error("Failed to create customer")
  });

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    createParty.mutate(customerData);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId' && value !== 'custom') {
      const product = products?.find((p: any) => p.id === value);
      if (product) {
        newItems[index] = { ...newItems[index], productId: product.id, description: product.name, unit: product.unit, unitPrice: Number(product.salePrice || 0) };
      }
    } else {
      (newItems as any)[index][field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { productId: "custom", description: "", qty: 1, unit: "PCS", unitPrice: 0, taxPercent: 0, discount: 0 }]);
  const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

  const calculateTotals = () => {
    let subtotal = 0, totalTax = 0;
    items.forEach(item => {
      const itemSubtotal = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discount || 0);
      subtotal += itemSubtotal;
      totalTax += itemSubtotal * (Number((item as any).taxPercent) || 0) / 100;
    });
    return { subtotal, totalTax, total: subtotal + totalTax - Number(formData.discount || 0) };
  };

  const { subtotal, totalTax, total } = calculateTotals();

  const handleSave = (e: React.FormEvent, status: "DRAFT" | "SENT" = "DRAFT") => {
    e.preventDefault();
    if (!formData.partyId) return toast.error("Please select a customer");
    if (items.some(i => !i.description)) return toast.error("Description required for all items");

    createQuotation.mutate({
      ...formData,
      status,
      discount: Number(formData.discount),
      items: items.map(item => {
        const itemSubtotal = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discount || 0);
        return {
          productId: item.productId === 'custom' ? null : item.productId,
          description: item.description,
          qty: Number(item.qty),
          unit: item.unit || "PCS",
          unitPrice: Number(item.unitPrice),
          taxAmount: Number((itemSubtotal * (Number((item as any).taxPercent) || 0) / 100).toFixed(2)),
          discount: Number(item.discount),
        };
      })
    });
  };

  const customers = parties?.filter((p: any) => p.type === 'CUSTOMER' || p.type === 'BOTH') || [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/quotations"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Quotation</h1>
          <p className="text-muted-foreground text-sm">Generate a new estimate</p>
        </div>
      </div>

      <Dialog open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Quick Add Customer</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-2"><Label>Name *</Label><Input required value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={customerData.email} onChange={e => setCustomerData({...customerData, email: e.target.value})} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setIsCustomerOpen(false)}>Cancel</Button><Button type="submit" disabled={createParty.isPending}>Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <form className="space-y-6">
        <Card className="border-border/50 shadow-sm"><CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <div className="flex gap-2">
                  <Select value={formData.partyId} onValueChange={(val) => setFormData({...formData, partyId: val})}><SelectTrigger className="flex-1"><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsCustomerOpen(true)}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Quote Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
                <div className="space-y-2"><Label>Valid Until</Label><Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} /></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Quote Number</Label><Input value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} /></div>
            </div>
          </div>
        </CardContent></Card>

        <Card className="border-border/50 shadow-sm"><CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left"><thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-4 py-3">Item Details</th><th className="px-4 py-3 w-24">Qty</th><th className="px-4 py-3 w-32">Rate (₹)</th><th className="px-4 py-3 w-24">Disc (₹)</th><th className="px-4 py-3 w-32">Tax (%)</th><th className="px-4 py-3 text-right w-32">Amount</th><th className="px-4 py-3 w-12"></th></tr></thead>
              <tbody className="divide-y border-t border-border/50">
                {items.map((item, index) => (
                  <tr key={index} className="group hover:bg-muted/20">
                    <td className="px-4 py-3 space-y-2">
                      <Select value={item.productId} onValueChange={(val) => handleItemChange(index, 'productId', val)}><SelectTrigger className="h-8 text-xs border-dashed bg-transparent flex-1"><SelectValue placeholder="Select Product" /></SelectTrigger><SelectContent><SelectItem value="custom" className="text-primary italic">Custom Item</SelectItem>{products?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                      <Input placeholder="Description" className="h-8 text-xs bg-transparent" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 align-top"><Input type="number" min="0.01" step="0.01" className="h-8 text-xs bg-transparent" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} /></td>
                    <td className="px-4 py-3 align-top"><Input type="number" min="0" step="0.01" className="h-8 text-xs bg-transparent" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} /></td>
                    <td className="px-4 py-3 align-top"><Input type="number" min="0" step="0.01" className="h-8 text-xs bg-transparent" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', e.target.value)} /></td>
                    <td className="px-4 py-3 align-top"><Select value={String((item as any).taxPercent)} onValueChange={(val) => handleItemChange(index, 'taxPercent', Number(val))}><SelectTrigger className="h-8 text-xs bg-transparent"><SelectValue placeholder="0%" /></SelectTrigger><SelectContent><SelectItem value="0">None (0%)</SelectItem>{taxes?.map((t: any) => <SelectItem key={t.id} value={String(t.rate)}>{t.name} ({t.rate}%)</SelectItem>)}</SelectContent></Select></td>
                    <td className="px-4 py-3 text-right font-medium align-top pt-5">{(() => { const itemSubtotal = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discount || 0); const taxAmount = itemSubtotal * (Number((item as any).taxPercent) || 0) / 100; return (itemSubtotal + taxAmount).toFixed(2); })()}</td>
                    <td className="px-4 py-3 text-right align-top pt-4"><Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeItem(index)} disabled={items.length === 1}><Trash2 className="h-4 w-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 border-t border-border/50"><Button type="button" variant="outline" size="sm" className="text-xs border-dashed" onClick={addItem}><Plus className="mr-2 h-3 w-3" /> Add Line Item</Button></div>
          </div>
        </CardContent></Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4"><div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Estimate notes." className="resize-none h-32" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div></div>
          <Card className="border-border/50 shadow-sm bg-muted/20"><CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Total Tax</span><span>₹{totalTax.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Global Discount (₹)</span><Input type="number" min="0" step="0.01" className="h-8 w-24 text-right bg-background" value={formData.discount} onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})} /></div>
            <div className="pt-4 border-t border-border flex justify-between items-center"><span className="font-medium">Total Amount</span><span className="text-xl font-bold text-primary">₹{total.toFixed(2)}</span></div>
          </CardContent></Card>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button variant="outline" type="button" onClick={(e) => handleSave(e, "DRAFT")} disabled={createQuotation.isPending}><Save className="mr-2 h-4 w-4" /> Save as Draft</Button>
          <Button type="button" onClick={(e) => handleSave(e, "SENT")} disabled={createQuotation.isPending}>{createQuotation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Save & Send</Button>
        </div>
      </form>
    </div>
  );
}
