"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, Building2, UserCircle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Business Details Query
  const { data: business, isLoading: isBusinessLoading } = useQuery({
    queryKey: ['business'],
    queryFn: async () => await apiClient.get('/business')
  });

  // Business Form State
  const [businessData, setBusinessData] = useState({
    name: "",
    gstin: "",
    address: "",
    pincode: "",
    email: "",
    phone: "",
  });

  // Sync business data when fetched
  useEffect(() => {
    if (business) {
      setBusinessData({
        name: business.name || "",
        gstin: business.gstin || "",
        address: business.address || "",
        pincode: business.pincode || "",
        email: business.email || "",
        phone: business.phone || "",
      });
    }
  }, [business]);

  const updateBusinessMutation = useMutation({
    mutationFn: (updatedData: any) => apiClient.patch("/business", updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business'] });
      toast.success("Business details updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update business details");
    }
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call for profile
    setTimeout(() => {
      setLoading(false);
      toast.success("Profile updated (simulated)");
    }, 800);
  };

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessMutation.mutate(businessData);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and business profile
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2 bg-muted/50">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Your Profile
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Details
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>
                Update your personal information and email address.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    disabled 
                    value={profileData.email}
                  />
                  <p className="text-[10px] text-muted-foreground">Email cannot be changed directly.</p>
                </div>
                <Button type="submit" disabled={loading} className="mt-6">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="business" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your business details, logo, and address to be shown on invoices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isBusinessLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleSaveBusiness} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="biz-name">Business Name *</Label>
                      <Input 
                        id="biz-name" 
                        required 
                        value={businessData.name}
                        onChange={(e) => setBusinessData({...businessData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-gst">GST Number</Label>
                      <Input 
                        id="biz-gst" 
                        placeholder="27AAAAA0000A1Z5"
                        value={businessData.gstin}
                        onChange={(e) => setBusinessData({...businessData, gstin: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="biz-address">Business Address</Label>
                    <Textarea 
                      id="biz-address" 
                      placeholder="Street, Area, Building..."
                      className="resize-none"
                      value={businessData.address}
                      onChange={(e) => setBusinessData({...businessData, address: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="biz-pincode">Pincode</Label>
                      <Input 
                        id="biz-pincode" 
                        placeholder="400001"
                        value={businessData.pincode}
                        onChange={(e) => setBusinessData({...businessData, pincode: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-email">Business Email</Label>
                      <Input 
                        id="biz-email" 
                        type="email"
                        placeholder="billing@yourbiz.com"
                        value={businessData.email}
                        onChange={(e) => setBusinessData({...businessData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biz-phone">Business Phone</Label>
                      <Input 
                        id="biz-phone" 
                        placeholder="+91 99999 99999"
                        value={businessData.phone}
                        onChange={(e) => setBusinessData({...businessData, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button type="submit" disabled={updateBusinessMutation.isPending}>
                      {updateBusinessMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Save Business Details
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
