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

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const invoiceId = params.id;

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => await apiClient.get(`/invoices/${invoiceId}`)
  });

  const { data: parties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => await apiClient.get('/parties')
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => await apiClient.get('/products')
  });

  const { data: taxes } = useQuery({
    queryKey: ['taxes'],
    queryFn: async () => await apiClient.get('/taxes')
  });

  const [formData, setFormData] = useState({
    partyId: "",
    type: "TAX_INVOICE",
    number: "",
    date: dayjs().format("YYYY-MM-DD"),
    dueDate: dayjs().add(30, 'day').format("YYYY-MM-DD"),
    status: "DRAFT",
    discount: 0,
    notes: "",
  });

  const [items, setItems] = useState([
    { productId: "custom", description: "", qty: 1, unit: "PCS", unitPrice: 0, taxPercent: 0, discount: 0 }
  ]);

  useEffect(() => {
    if (invoice) {
      setFormData({
        partyId: invoice.partyId || "",
        type: invoice.type || "TAX_INVOICE",
        number: invoice.number || "",
        date: invoice.date ? dayjs(invoice.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
        dueDate: invoice.dueDate ? dayjs(invoice.dueDate).format("YYYY-MM-DD") : "",
        status: invoice.status || "DRAFT",
        discount: Number(invoice.discount) || 0,
        notes: invoice.notes || "",
      });

      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items.map((item: any) => {
          // Calculate approx tax percent for display based on item amounts
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
  }, [invoice]);

  const updateInvoice = useMutation({
    mutationFn: (updatedInvoice: any) => apiClient.put(`/invoices/${invoiceId}`, updatedInvoice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      toast.success("Invoice updated successfully");
      router.push("/invoices");
    },
    onError: (error: any) => {
      const msg = Array.isArray(error?.error) ? error.error[0]?.message : error?.error || "Failed to update invoice";
      toast.error(msg);
    }
  });

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId' && value !== 'custom') {
      const product = products?.find((p: any) => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          description: product.name,
          unit: product.unit,
          unitPrice: Number(product.salePrice),
        };
      }
    } else {
      (newItems as any)[index][field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: "custom", description: "", qty: 1, unit: "PCS", unitPrice: 0, taxPercent: 0, discount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    
    items.forEach(item => {
      const itemSubtotal = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discount || 0);
      subtotal += itemSubtotal;
      totalTax += itemSubtotal * (Number((item as any).taxPercent) || 0) / 100;
    });

    const total = subtotal + totalTax - Number(formData.discount || 0);
    return { subtotal, totalTax, total };
  };

  const { subtotal, totalTax, total } = calculateTotals();

  const handleSave = (e: React.FormEvent, status: string) => {
    e.preventDefault();
    
    if (!formData.partyId) {
      toast.error("Please select a customer");
      return;
    }

    if (items.some(i => !i.description)) {
      toast.error("Please provide a description for all items");
      return;
    }

    const payload = {
      ...formData,
      status,
      discount: Number(formData.discount),
      items: items.map(item => {
        const itemSubtotal = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discount || 0);
        const taxAmount = itemSubtotal * (Number((item as any).taxPercent) || 0) / 100;
        
        return {
          productId: item.productId === 'custom' ? null : item.productId,
          description: item.description,
          qty: Number(item.qty),
          unit: item.unit || "PCS",
          unitPrice: Number(item.unitPrice),
          taxAmount: Number(taxAmount.toFixed(2)),
          discount: Number(item.discount),
        };
      })
    };

    updateInvoice.mutate(payload);
  };

  const customers = parties?.filter((p: any) => p.type === 'CUSTOMER' || p.type === 'BOTH') || [];

  if (invoiceLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Invoice {formData.number}</h1>
          <p className="text-muted-foreground text-sm">
            Modify existing invoice details
          </p>
        </div>
      </div>

      <form className="space-y-6">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer *</Label>
                  <Select 
                    value={formData.partyId} 
                    onValueChange={(val) => setFormData({...formData, partyId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Date</Label>
                    <Input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input 
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input 
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(val) => setFormData({...formData, type: val})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TAX_INVOICE">Tax Invoice</SelectItem>
                        <SelectItem value="PROFORMA">Proforma Invoice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Item Details</th>
                    <th className="px-4 py-3 font-medium w-24">Qty</th>
                    <th className="px-4 py-3 font-medium w-32">Rate (₹)</th>
                    <th className="px-4 py-3 font-medium w-24">Disc (₹)</th>
                    <th className="px-4 py-3 font-medium w-32">Tax Type</th>
                    <th className="px-4 py-3 font-medium text-right w-32">Amount</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y border-t border-border/50">
                  {items.map((item, index) => (
                    <tr key={index} className="group hover:bg-muted/20">
                      <td className="px-4 py-3 space-y-2">
                        <Select 
                          value={item.productId} 
                          onValueChange={(val) => handleItemChange(index, 'productId', val)}
                        >
                          <SelectTrigger className="h-8 text-xs border-dashed bg-transparent w-full">
                            <SelectValue placeholder="Select Product" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom" className="text-primary italic">Custom Item</SelectItem>
                            {products?.map((p: any) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder="Description" 
                          className="h-8 text-xs bg-transparent mt-2"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Input 
                          type="number" min="0.01" step="0.01"
                          className="h-8 text-xs bg-transparent"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Input 
                          type="number" min="0" step="0.01"
                          className="h-8 text-xs bg-transparent"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Input 
                          type="number" min="0" step="0.01"
                          className="h-8 text-xs bg-transparent"
                          value={item.discount}
                          onChange={(e) => handleItemChange(index, 'discount', e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Select 
                          value={String((item as any).taxPercent)} 
                          onValueChange={(val) => handleItemChange(index, 'taxPercent', Number(val))}
                        >
                          <SelectTrigger className="h-8 text-xs bg-transparent">
                            <SelectValue placeholder="0%" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">None (0%)</SelectItem>
                            {taxes?.map((t: any) => (
                              <SelectItem key={t.id} value={String(t.rate)}>{t.name} ({t.rate}%)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right font-medium align-top pt-5">
                        {(() => {
                          const itemSubtotal = (Number(item.qty) * Number(item.unitPrice)) - Number(item.discount || 0);
                          const taxAmount = itemSubtotal * (Number((item as any).taxPercent) || 0) / 100;
                          return (itemSubtotal + taxAmount).toFixed(2);
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right align-top pt-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-border/50">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-dashed"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Add Line Item
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Notes</Label>
              <Textarea 
                placeholder="Thanks for your business."
                className="resize-none h-32"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>
          
          <Card className="border-border/50 shadow-sm bg-muted/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Tax</span>
                <span>₹{totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Global Discount (₹)</span>
                <Input 
                  type="number" min="0" step="0.01"
                  className="h-8 w-24 text-right bg-background"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: Number(e.target.value)})}
                />
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="font-medium">Total Amount</span>
                <span className="text-xl font-bold text-primary">₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button 
            variant="outline" 
            type="button"
            onClick={(e) => handleSave(e, formData.status)}
            disabled={updateInvoice.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            Update Invoice
          </Button>
        </div>
      </form>
    </div>
  );
}
