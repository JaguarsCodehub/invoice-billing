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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function PartiesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [formData, setFormData] = useState({
    name: "",
    type: "CUSTOMER",
    gstin: "",
    email: "",
    phone: "",
    openingBalance: 0
  });

  const { data: parties, isLoading } = useQuery({
    queryKey: ['parties', typeFilter],
    queryFn: async () => {
      const url = typeFilter === "ALL" ? "/parties" : `/parties?type=${typeFilter}`;
      return await apiClient.get(url);
    }
  });

  const createParty = useMutation({
    mutationFn: (newParty: any) => apiClient.post("/parties", newParty),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      setIsDialogOpen(false);
      toast.success("Party created successfully");
      setFormData({ name: "", type: "CUSTOMER", gstin: "", email: "", phone: "", openingBalance: 0 });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create party");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createParty.mutate({
      ...formData,
      openingBalance: Number(formData.openingBalance)
    });
  };

  const filteredParties = parties?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone?.includes(searchTerm)
  ) || [];

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parties</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customers and suppliers
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Party
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Party</DialogTitle>
              <DialogDescription>
                Create a new customer or supplier account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business/Person Name *</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Party Type *</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(val) => setFormData({...formData, type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="SUPPLIER">Supplier</SelectItem>
                      <SelectItem value="BOTH">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (Optional)</Label>
                  <Input 
                    id="gstin" 
                    value={formData.gstin}
                    onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input 
                  id="openingBalance" 
                  type="number"
                  step="0.01" 
                  value={formData.openingBalance}
                  onChange={(e) => setFormData({...formData, openingBalance: Number(e.target.value)})}
                />
                <p className="text-[10px] text-muted-foreground">+ve for Receivables, -ve for Payables</p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createParty.isPending}>
                  {createParty.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Party
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
            placeholder="Search parties..." 
            className="pl-8 bg-background border-border/50 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
           <Label className="text-muted-foreground font-normal">Filter:</Label>
           <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Parties</SelectItem>
                <SelectItem value="CUSTOMER">Customers Only</SelectItem>
                <SelectItem value="SUPPLIER">Suppliers Only</SelectItem>
              </SelectContent>
            </Select>
        </div>
      </div>

      <div className="rounded-md border border-border/50 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Party Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading parties...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredParties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No parties found.
                </TableCell>
              </TableRow>
            ) : (
              filteredParties.map((party: any) => (
                <TableRow key={party.id}>
                  <TableCell className="font-medium">{party.name}</TableCell>
                  <TableCell>
                    <Badge variant={party.type === "CUSTOMER" ? "default" : party.type === "SUPPLIER" ? "secondary" : "outline"}>
                      {party.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{party.phone || "-"}</div>
                    <div className="text-xs text-muted-foreground">{party.email}</div>
                  </TableCell>
                  <TableCell>{party.gstin || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={Number(party.openingBalance) >= 0 ? "text-green-600" : "text-destructive"}>
                      ₹{Math.abs(Number(party.openingBalance)).toFixed(2)}
                      {Number(party.openingBalance) >= 0 ? " Dr" : " Cr"}
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
