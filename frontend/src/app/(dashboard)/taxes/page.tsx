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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TaxesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    rate: 0,
    description: "",
    isGroup: false,
  });

  const { data: taxes, isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: async () => await apiClient.get('/taxes')
  });

  const createTax = useMutation({
    mutationFn: (newTax: any) => apiClient.post("/taxes", newTax),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      setIsDialogOpen(false);
      toast.success("Tax rate created successfully");
      setFormData({ name: "", rate: 0, description: "", isGroup: false });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tax rate");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTax.mutate({
      name: formData.name,
      components: [
        {
          name: formData.name,
          rate: Number(formData.rate)
        }
      ]
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tax Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage GST, TDS, and other tax structures
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Tax Rate
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Tax Rate</DialogTitle>
              <DialogDescription>
                Define a new tax component (e.g., CGST 9%, IGST 18%)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tax Name *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. IGST 18%"
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Percentage Rate (%) *</Label>
                <Input 
                  id="rate" 
                  type="number" step="0.01" min="0" required
                  value={formData.rate}
                  onChange={(e) => setFormData({...formData, rate: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTax.isPending}>
                  {createTax.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border/50 bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Tax Name</TableHead>
              <TableHead>Rate (%)</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading tax rates...
                  </div>
                </TableCell>
              </TableRow>
            ) : taxes?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No tax rates configured yet.
                </TableCell>
              </TableRow>
            ) : (
              taxes?.map((tax: any) => (
                <TableRow key={tax.id}>
                  <TableCell className="font-medium text-primary">
                    {tax.name} {tax.isGroup && "(Group)"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {Number(tax.rate).toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tax.description || "-"}
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
