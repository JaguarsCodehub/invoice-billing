"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
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
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate({
      ...formData,
      purchasePrice: Number(formData.purchasePrice),
      salePrice: Number(formData.salePrice)
    });
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

      <div className="rounded-md border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>HSN/SAC</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Sale Price</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading products...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">
                    {product.name}
                    <div className="text-xs text-muted-foreground mt-0.5">Unit: {product.unit}</div>
                  </TableCell>
                  <TableCell>{product.hsnSac || "-"}</TableCell>
                  <TableCell className="text-right">₹{Number(product.purchasePrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">₹{Number(product.salePrice).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={product.currentStock > 0 ? "secondary" : "destructive"}>
                      {product.currentStock} {product.unit}
                    </Badge>
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
