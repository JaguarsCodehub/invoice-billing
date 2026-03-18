"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AmountInput } from "@/components/ui/amount-input";
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
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Trash2, Plus, Loader2, ArrowLeft, Save, Send, Download, Printer, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

export default function CreateQuotationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Layout control
  const [showEditor, setShowEditor] = useState(true);

  // Fetch related data
  const { data: business } = useQuery({
    queryKey: ['business'],
    queryFn: async () => await apiClient.get('/business')
  });

  const { data: parties } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => await apiClient.get('/parties')
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => await apiClient.get('/products')
  });

  // Modal states
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerData, setCustomerData] = useState({ name: "", email: "", phone: "", type: "CUSTOMER" });

  // Form state
  const [formData, setFormData] = useState({
    partyId: "",
    number: `EST-${Date.now().toString().slice(-6)}`,
    date: dayjs().format("YYYY-MM-DD"),
    validUntil: dayjs().add(15, 'day').format("YYYY-MM-DD"),
    time: dayjs().format("HH:mm"),
    status: "DRAFT",
    discount: 0,
    notes: "Estimate valid for 15 days.",
    termsAndConditions: "1. Quotation is valid for 15 days.\n2. Prices are subject to change based on market conditions.",
  });

  const [items, setItems] = useState([
    { 
      productId: "custom", 
      description: "", 
      hsnSac: "", 
      qty: 1, 
      unit: "PCS", 
      unitPrice: 0, 
      taxPercent: 0, 
      discount: 0,
      discountPercent: 0
    }
  ]);

  // Sync party details when partyId changes
  const selectedParty = useMemo(() => {
    return parties?.find((p: any) => p.id === formData.partyId);
  }, [parties, formData.partyId]);

  const createQuotationMutation = useMutation({
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
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          description: product.name,
          unit: product.unit,
          unitPrice: Number(product.salePrice),
          hsnSac: (product as any).hsnSac || "",
        };
      }
    } else {
      (newItems as any)[index][field] = value;

      // Handle discount sync
      if (field === 'unitPrice' || field === 'qty') {
        const rate = Number(newItems[index].unitPrice);
        const discP = Number(newItems[index].discountPercent);
        newItems[index].discount = Number(((rate * discP) / 100).toFixed(2));
      } else if (field === 'discountPercent') {
        const rate = Number(newItems[index].unitPrice);
        newItems[index].discount = Number(((rate * Number(value)) / 100).toFixed(2));
      } else if (field === 'discount') {
        const rate = Number(newItems[index].unitPrice);
        if (rate > 0) {
          newItems[index].discountPercent = Number(((Number(value) / rate) * 100).toFixed(2));
        }
      }
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { 
      productId: "custom", 
      description: "", 
      hsnSac: "", 
      qty: 1, 
      unit: "PCS", 
      unitPrice: 0, 
      taxPercent: 0, 
      discount: 0,
      discountPercent: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let itemDiscounts = 0;
    
    items.forEach(item => {
      const lineTotal = Number(item.qty) * Number(item.unitPrice);
      const itemSubtotal = lineTotal - Number(item.discount || 0);
      subtotal += lineTotal;
      itemDiscounts += Number(item.discount || 0);
      totalTax += itemSubtotal * (Number((item as any).taxPercent) || 0) / 100;
    });

    const totalDiscount = itemDiscounts;
    const total = subtotal - totalDiscount + totalTax;
    return { subtotal, totalTax, total, totalDiscount };
  };

  const { subtotal, totalTax, total, totalDiscount } = calculateTotals();

  const numberToWords = (num: number) => {
    return `Rupees ${num.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Only`;
  };

  const handleSave = (e: React.FormEvent, status: string) => {
    e.preventDefault();
    
    if (!formData.partyId) {
      toast.error("Please select a customer");
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
          hsnSac: item.hsnSac,
        };
      })
    };

    createQuotationMutation.mutate(payload);
  };

  const customers = parties?.filter((p: any) => p.type === 'CUSTOMER' || p.type === 'BOTH') || [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/quotations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Create Quotation {formData.number}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowEditor(!showEditor)}
          >
            {showEditor ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showEditor ? "Hide Editor" : "Show Editor"}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => handleSave(e, formData.status)}
            disabled={createQuotationMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" /> Save Quotation
          </Button>
        </div>
      </div>

      {/* Main Content: Split Pane */}
      <div className="flex flex-1 overflow-hidden bg-muted/30">
        {/* Left Side: Editor */}
        <div className={cn(
          "overflow-y-auto border-r transition-all duration-300 ease-in-out scrollbar-thin scrollbar-thumb-muted-foreground/20",
          showEditor ? "w-1/2 p-6" : "w-0 p-0 overflow-hidden border-none"
        )}>
          <div className={cn("space-y-6 max-w-3xl mx-auto", !showEditor && "invisible")}>
            {/* Customer & Quotation Details */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-semibold text-muted-foreground">Select Customer</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.partyId} 
                        onValueChange={(val) => setFormData({...formData, partyId: val})}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Search or select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((p: any) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setIsCustomerOpen(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-semibold text-muted-foreground">Quotation No.</Label>
                    <Input className="h-9" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-semibold text-muted-foreground">Date</Label>
                    <Input type="date" className="h-9" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-semibold text-muted-foreground">Valid Until</Label>
                    <Input type="date" className="h-9" value={formData.validUntil} onChange={(e) => setFormData({...formData, validUntil: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-semibold text-muted-foreground">Time</Label>
                    <Input type="time" className="h-9" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Section */}
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Line Items</span>
                <Button variant="ghost" size="sm" onClick={addItem} className="h-7 text-xs font-semibold hover:bg-background">
                  <Plus className="mr-1 h-3 w-3" /> Add Item
                </Button>
              </div>
              <CardContent className="p-0">
                <div className="divide-y border-border/50">
                  {items.map((item, index) => (
                    <div key={index} className={cn(
                      "p-4 space-y-3 group transition-colors",
                      index !== items.length - 1 ? "border-b-[12px] border-zinc-200/80" : "",
                      "bg-background/50 hover:bg-background"
                    )}>
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <Select 
                            value={item.productId} 
                            onValueChange={(val) => handleItemChange(index, 'productId', val)}
                          >
                            <SelectTrigger className="h-8 text-xs border-dashed">
                              <SelectValue placeholder="Select Product" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom" className="text-primary italic">Custom Item</SelectItem>
                              {products?.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="h-8 flex items-center px-3 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-md border border-emerald-100">
                            {item.productId === 'custom' ? "Custom Item Ready" : "Product Linked"}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">HSN/SAC</Label>
                          <Input className="h-7 text-xs" value={item.hsnSac} onChange={(e) => handleItemChange(index, 'hsnSac', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Quantity</Label>
                          <AmountInput className="h-7 text-xs" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Unit Price</Label>
                          <AmountInput className="h-7 text-xs" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Discount (%)</Label>
                          <AmountInput className="h-7 text-xs" value={item.discountPercent} onChange={(e) => handleItemChange(index, 'discountPercent', Number(e.target.value))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Discount (Amt)</Label>
                          <AmountInput className="h-7 text-xs" value={item.discount} onChange={(e) => handleItemChange(index, 'discount', Number(e.target.value))} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">GST Rate (%)</Label>
                          <Select 
                            value={String(item.taxPercent)} 
                            onValueChange={(val) => handleItemChange(index, 'taxPercent', Number(val))}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder="0%" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="12">12%</SelectItem>
                              <SelectItem value="18">18%</SelectItem>
                              <SelectItem value="28">28%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1 flex flex-col justify-end">
                          <div className="text-right pr-1 border-l pl-3">
                            <span className="text-[10px] text-muted-foreground block">AMOUNT</span>
                            <span className="font-bold text-md text-emerald-500">
                              ₹{((Number(item.qty) * Number(item.unitPrice)) - (Number(item.discount || 0)) + (((Number(item.qty) * Number(item.unitPrice)) - (Number(item.discount || 0))) * Number(item.taxPercent || 0) / 100)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bottom Config */}
            <div className="grid grid-cols-2 gap-6 pb-12">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-semibold text-muted-foreground">Notes/Description</Label>
                  <Textarea 
                    className="min-h-[100px] text-xs resize-none"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-semibold text-muted-foreground">Terms & Conditions</Label>
                  <Textarea 
                    className="min-h-[100px] text-xs resize-none"
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData({...formData, termsAndConditions: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-border/50 bg-muted/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span>Total Tax</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t flex justify-between items-center text-lg font-bold text-primary">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Preview */}
        <div className={cn(
          "overflow-y-auto p-4 md:p-8 flex justify-center bg-zinc-200/50 scrollbar-thin scrollbar-thumb-muted-foreground/20 transition-all duration-300",
          showEditor ? "w-1/2" : "w-full"
        )}>
          <div className="relative w-full max-w-[800px] h-fit bg-white shadow-2xl flex flex-col p-6 font-sans text-black border border-zinc-300" style={{ minHeight: '11.23in' }}>
            {/* Template Header */}
            <div className="flex border border-black min-h-[100px]">
              <div className="flex-1 p-3 border-r border-black flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-bold uppercase leading-tight line-clamp-1">{business?.name || "COMPANY NAME"}</h2>
                  <p className="text-[11px] mt-0.5 leading-tight line-clamp-2">
                    {business?.address || "Address details would go here."}
                    {business?.pincode ? ` - ${business.pincode}` : ""}
                  </p>
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
              QUOTATION / ESTIMATE
            </div>

            {/* Details Section */}
            <div className="flex border-x border-b border-black text-[11px]">
              <div className="flex-1 border-r border-black p-2 flex flex-col gap-1">
                <span className="font-bold underline mb-1 uppercase text-[10px] text-zinc-600">Customer Details</span>
                <p><span className="font-semibold">Party Name:</span> {selectedParty?.name || ""}</p>
                <p><span className="font-semibold">Address:</span> {selectedParty?.address || ""}</p>
                <p><span className="font-semibold">Phone No.:</span> {selectedParty?.phone || ""}</p>
                <p><span className="font-semibold">Email ID:</span> {selectedParty?.email || ""}</p>
                <p><span className="font-semibold">GSTIN No.:</span> {selectedParty?.gstin || ""}</p>
                <p><span className="font-semibold">State:</span> Maharashtra</p>
              </div>
              <div className="w-64 p-2 flex flex-col gap-1">
                <span className="font-bold underline mb-1 uppercase text-[10px] text-zinc-600">Quotation Details</span>
                <p><span className="font-semibold">Quotation No.:</span> {formData.number}</p>
                <p><span className="font-semibold">Date:</span> {dayjs(formData.date).format("DD/MM/YYYY")}</p>
                <p><span className="font-semibold">Time:</span> {formData.time}</p>
                <p><span className="font-semibold">Valid Until:</span> {dayjs(formData.validUntil).format("DD/MM/YYYY")}</p>
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

            {/* Table Rows (Fixed height container) */}
            <div className="flex-1 border-x border-black overflow-hidden flex flex-col relative">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[40px_1fr_80px_50px_40px_70px_60px_60px_70px_90px] border-b border-zinc-100 text-[10px] min-h-[32px] items-center text-center">
                  <div className="border-r border-black h-full py-2 bg-zinc-50/30 text-zinc-500">{i + 1}</div>
                  <div className="border-r border-black h-full py-2 text-left px-2">
                    <span className="font-semibold block truncate leading-tight uppercase text-zinc-800">{item.description}</span>
                  </div>
                  <div className="border-r border-black h-full py-2">{item.hsnSac}</div>
                  <div className="border-r border-black h-full py-2 font-medium">{item.qty}</div>
                  <div className="border-r border-black h-full py-2 uppercase text-zinc-500">{item.unit}</div>
                  <div className="border-r border-black h-full py-2">{Number(item.unitPrice).toFixed(2)}</div>
                  <div className="border-r border-black h-full py-2 text-zinc-600">{Number(item.discount).toFixed(2)}</div>
                  <div className="border-r border-black h-full py-2">{item.taxPercent}%</div>
                  <div className="border-r border-black h-full py-2">
                    {(((Number(item.qty) * Number(item.unitPrice)) - Number(item.discount || 0)) * (Number(item.taxPercent) / 100)).toFixed(2)}
                  </div>
                  <div className="h-full py-2 text-right px-2 font-bold bg-zinc-50/20">
                    {((Number(item.qty) * Number(item.unitPrice)) - (Number(item.discount || 0)) + (((Number(item.qty) * Number(item.unitPrice)) - (Number(item.discount || 0))) * Number(item.taxPercent || 0) / 100)).toFixed(2)}
                  </div>
                </div>
              ))}
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
              <div className="p-1 px-2 text-right pr-2">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>

            {/* Footer Summary */}
            <div className="flex border-x border-b border-black text-[10px] min-h-[140px]">
              <div className="flex-1 flex flex-col border-r border-black divide-y divide-black">
                <div className="p-2 min-h-[50px]">
                  <span className="font-bold underline uppercase text-[9px] text-zinc-600 block mb-1">Notes:</span>
                  <p className="whitespace-pre-wrap leading-tight">{formData.notes}</p>
                </div>
                <div className="p-2 min-h-[30px] bg-zinc-100">
                   <span className="font-bold uppercase text-[9px] text-zinc-600">Amount In Words:</span>
                   <p className="font-semibold italic mt-1">{numberToWords(total)}</p>
                </div>
                <div className="p-2 flex-1">
                  <span className="font-bold underline uppercase text-[9px] text-zinc-600 block mb-1">Terms and Conditions:</span>
                  <p className="whitespace-pre-wrap leading-tight text-[9px]">{formData.termsAndConditions}</p>
                </div>
              </div>
              <div className="w-56 flex flex-col divide-y divide-black font-semibold">
                <div className="flex justify-between p-2">
                  <span>Sub Total</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span>Tax Amount</span>
                  <span>₹{totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2">
                  <span>Discount</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-2 bg-zinc-300 text-sm font-bold border-y border-black self-end w-full">
                  <span>Total Amount</span>
                  <span>₹{total.toFixed(2)}</span>
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
      </div>

      {/* Modals */}
      <Dialog open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quick Add Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input required value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={customerData.email} onChange={e => setCustomerData({...customerData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCustomerOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createParty.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
