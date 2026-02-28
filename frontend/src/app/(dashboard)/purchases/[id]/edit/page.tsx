"use client";

import { useState, useEffect } from "react";
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
import { Trash2, Plus, Loader2, ArrowLeft, Save, Send } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import dayjs from "dayjs";

export default function EditPurchasePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const billId = params.id;

  const { data: bill, isLoading: billLoading } = useQuery({
    queryKey: ['purchaseBill', billId],
    queryFn: async () => await apiClient.get(`/purchases/invoices/${billId}`)
  });

  const { data: parties } = useQuery({ queryKey: ['parties'], queryFn: async () => await apiClient.get('/parties') });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: async () => await apiClient.get('/products') });
  const { data: taxes } = useQuery({ queryKey: ['taxes'], queryFn: async () => await apiClient.get('/taxes') });

  const [formData, setFormData] = useState({
    partyId: "",
    number: "",
    date: dayjs().format("YYYY-MM-DD"),
    status: "DRAFT",
    discount: 0,
    notes: "",
  });

  const [items, setItems] = useState([
    { productId: "custom", description: "", qty: 1, unit: "PCS", unitPrice: 0, taxPercent: 0, discount: 0 }
  ]);

  useEffect(() => {
    if (bill) {
      setFormData({
        partyId: bill.partyId || "",
        number: bill.number || "",
        date: bill.date ? dayjs(bill.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        status: bill.status || "DRAFT",
        discount: Number(bill.discount) || 0,
        notes: bill.notes || "",
      });

      if (bill.items && bill.items.length > 0) {
        setItems(bill.items.map((item: any) => {
          const sub = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discount);
          const taxP = sub > 0 ? Math.round((Number(item.taxAmount) / sub) * 100) : 0;
          return {
            productId: item.productId || "custom",
            description: item.description || "",
            qty: Number(item.qty) || 1,
            unit: item.unit || "PCS",
            unitPrice: Number(item.unitPrice) || 0,
            taxPercent: taxP,
            discount: Number(item.discount) || 0,
          };
        }));
      }
    }
  }, [bill]);

  const updatePurchase = useMutation({
    mutationFn: (updatedPurchase: any) => apiClient.put(`/purchases/invoices/${billId}`, updatedPurchase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseBill', billId] });
      toast.success("Purchase updated successfully");
      router.push("/purchases");
    },
    onError: (error: any) => {
      const msg = Array.isArray(error?.error) ? error.error[0]?.message : error?.error || "Failed to record purchase";
      toast.error(msg);
    }
  });

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId' && value !== 'custom') {
      const product = products?.find((p: any) => p.id === value);
      if (product) {
        newItems[index] = { ...newItems[index], productId: product.id, description: product.name, unit: product.unit, unitPrice: Number(product.purchasePrice || 0) };
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

  const handleSave = (e: React.FormEvent, status: string) => {
    e.preventDefault();
    if (!formData.partyId) return toast.error("Please select a supplier");
    if (items.some(i => !i.description)) return toast.error("Description required for all items");

    updatePurchase.mutate({
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

  const suppliers = parties?.filter((p: any) => p.type === 'SUPPLIER' || p.type === 'BOTH') || [];

  if (billLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/purchases"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Purchase Bill {formData.number}</h1>
          <p className="text-muted-foreground text-sm">Modify existing purchase records</p>
        </div>
      </div>

      <form className="space-y-6">
        <Card className="border-border/50 shadow-sm"><CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <div className="flex gap-2">
                  <Select value={formData.partyId} onValueChange={(val) => setFormData({...formData, partyId: val})}><SelectTrigger className="flex-1"><SelectValue placeholder="Select supplier" /></SelectTrigger><SelectContent>{suppliers.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Bill Date</Label><Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Bill Number</Label><Input value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} /></div>
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
                      <Select value={item.productId} onValueChange={(val) => handleItemChange(index, 'productId', val)}><SelectTrigger className="h-8 text-xs border-dashed bg-transparent w-full"><SelectValue placeholder="Select Product" /></SelectTrigger><SelectContent><SelectItem value="custom" className="text-primary italic">Custom Item</SelectItem>{products?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                      <Input placeholder="Description" className="h-8 text-xs bg-transparent mt-2" value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} />
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
          <div className="space-y-4"><div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Bill notes." className="resize-none h-32" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div></div>
          <Card className="border-border/50 shadow-sm bg-muted/20"><CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Total Tax</span><span>₹{totalTax.toFixed(2)}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Global Discount (₹)</span><Input type="number" min="0" step="0.01" className="h-8 w-24 text-right bg-background" value={formData.discount} onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})} /></div>
            <div className="pt-4 border-t border-border flex justify-between items-center"><span className="font-medium">Total Amount</span><span className="text-xl font-bold text-primary">₹{total.toFixed(2)}</span></div>
          </CardContent></Card>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button type="button" onClick={(e) => handleSave(e, formData.status)} disabled={updatePurchase.isPending}>{updatePurchase.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Update Purchase</Button>
        </div>
      </form>
    </div>
  );
}
