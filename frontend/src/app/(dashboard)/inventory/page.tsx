"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus, 
  Search, 
  Loader2, 
  Edit2, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import dayjs from "dayjs";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [historyProductId, setHistoryProductId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    hsnSac: "",
    unit: "PCS",
    purchasePrice: 0,
    salePrice: 0,
    trackInventory: true
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => await apiClient.get('/products')
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['product-history', historyProductId],
    queryFn: async () => historyProductId ? await apiClient.get(`/inventory/history/${historyProductId}`) : [],
    enabled: !!historyProductId
  });

  const createProduct = useMutation({
    mutationFn: (newProduct: any) => apiClient.post("/products", newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsDialogOpen(false);
      toast.success("Product created successfully");
      setFormData({ name: "", hsnSac: "", unit: "PCS", purchasePrice: 0, salePrice: 0, trackInventory: true });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create product");
    }
  });

  const updateProduct = useMutation({
    mutationFn: (updatedProduct: any) => apiClient.patch(`/products/${selectedProduct.id}`, updatedProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsEditDialogOpen(false);
      toast.success("Product updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update product");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate({
      ...formData,
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice)
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct.mutate({
      ...formData,
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice)
    });
  };

  const openEditDialog = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      hsnSac: product.hsnSac || "",
      unit: product.unit,
      purchasePrice: Number(product.purchasePrice),
      salePrice: Number(product.salePrice),
      trackInventory: product.trackInventory
    });
    setIsEditDialogOpen(true);
  };

  const filteredProducts = products?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products & Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Manage your catalog and stock levels
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Product/Item</DialogTitle>
              <DialogDescription>
                Add a new item to your catalog.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input 
                    id="unit" 
                    placeholder="e.g. PCS, KG, BOX"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsnSac">HSN / SAC</Label>
                  <Input 
                    id="hsnSac" 
                    value={formData.hsnSac}
                    onChange={(e) => setFormData({...formData, hsnSac: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input 
                    id="purchasePrice" 
                    type="number"
                    step="0.01" 
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sales Price</Label>
                  <Input 
                    id="salePrice" 
                    type="number" 
                    step="0.01"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({...formData, salePrice: Number(e.target.value)})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input 
                id="edit-name" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unit</Label>
                <Input 
                  id="edit-unit" 
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-hsnSac">HSN / SAC</Label>
                <Input 
                  id="edit-hsnSac" 
                  value={formData.hsnSac}
                  onChange={(e) => setFormData({...formData, hsnSac: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchasePrice">Purchase Price</Label>
                <Input 
                  id="edit-purchasePrice" 
                  type="number"
                  step="0.01" 
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({...formData, purchasePrice: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salePrice">Sales Price</Label>
                <Input 
                  id="edit-salePrice" 
                  type="number" 
                  step="0.01"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({...formData, salePrice: Number(e.target.value)})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock History Sheet */}
      <Sheet open={!!historyProductId} onOpenChange={(open: boolean) => !open && setHistoryProductId(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Stock Movement History</SheetTitle>
            <SheetDescription>
              Detailed version history for {filteredProducts.find((p: any) => p.id === historyProductId)?.name}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {isHistoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !history || history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground italic flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 opacity-20" />
                No history entries found for this product.
              </div>
            ) : (
              <div className="relative space-y-4 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {history.map((entry: any) => (
                  <div key={entry.id} className="relative flex items-start gap-4 pl-8">
                    <span className={cn(
                      "absolute left-0 mt-1.5 h-8 w-8 rounded-full border-4 border-background flex items-center justify-center text-xs font-bold shadow-sm",
                      entry.type === 'IN' ? "bg-emerald-100 text-emerald-700" : 
                      entry.type === 'OUT' ? "bg-rose-100 text-rose-700" : 
                      "bg-blue-100 text-blue-700"
                    )}>
                      {entry.type === 'IN' ? <ArrowDownLeft className="h-4 w-4" /> : 
                       entry.type === 'OUT' ? <ArrowUpRight className="h-4 w-4" /> : 
                       <Plus className="h-4 w-4" />}
                    </span>
                    <div className="flex flex-col gap-1 w-full bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">
                          {entry.type === 'IN' ? 'Stock Added' : 
                           entry.type === 'OUT' ? 'Stock Sold' : 
                           'Adjustment'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dayjs(entry.date).format('DD MMM YYYY, hh:mm A')}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <div className="text-xs">
                          {entry.reference && (
                            <div className="text-primary font-medium">Ref: {entry.reference}</div>
                          )}
                          {entry.notes && (
                            <div className="text-muted-foreground italic uppercase text-[10px] mt-0.5">{entry.notes}</div>
                          )}
                        </div>
                        <div className={cn(
                          "font-bold text-base",
                          entry.type === 'IN' ? "text-emerald-600" : 
                          entry.type === 'OUT' ? "text-rose-600" : 
                          "text-blue-600"
                        )}>
                          {entry.type === 'OUT' ? '-' : '+'}{Number(entry.qty).toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            className="pl-8 bg-background border-border/50 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border/50 bg-card overflow-hidden h-[calc(100vh-300px)] flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[300px]">Product Name</TableHead>
                <TableHead>HSN/SAC</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex items-center justify-center text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Loading products...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product: any) => (
                  <TableRow key={product.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      {product.name}
                      <div className="text-xs text-muted-foreground mt-0.5">Unit: {product.unit}</div>
                    </TableCell>
                    <TableCell>{product.hsnSac || "-"}</TableCell>
                    <TableCell className="text-right text-slate-500">₹{Number(product.purchasePrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">₹{Number(product.salePrice).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={product.currentStock > 0 ? "secondary" : "destructive"}
                        className="font-mono"
                      >
                        {product.currentStock} {product.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-primary hover:bg-primary/10"
                          onClick={() => setHistoryProductId(product.id)}
                          title="View History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-600 hover:bg-slate-100"
                          onClick={() => openEditDialog(product)}
                          title="Edit Product"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
