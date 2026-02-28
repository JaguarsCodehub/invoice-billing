"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Download, TrendingUp, IndianRupee, FileText } from "lucide-react";
import dayjs from "dayjs";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD')
  });

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'sales', dateRange],
    queryFn: async () => await apiClient.get(`/reports/sales?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Reports</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your sales, purchases, and taxes
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Sales Report</CardTitle>
          <CardDescription>View your sales performance over a specific period</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4 items-end mb-8">
            <div className="space-y-2 flex-1 md:max-w-[200px]">
              <Label>Start Date</Label>
              <Input 
                type="date" 
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2 flex-1 md:max-w-[200px]">
              <Label>End Date</Label>
              <Input 
                type="date" 
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Report
            </Button>
          </form>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reportData ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-none border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales Revenue</CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">₹{Number(reportData.totalSales).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    For selected period
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-none border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Invoices Issued</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.invoiceCount}</div>
                </CardContent>
              </Card>

              <Card className="shadow-none border-border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Collected Tax</CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{Number(reportData.totalTax).toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1 text-orange-600">
                    GST / TDS Applicable
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground border border-dashed rounded-lg">
              Select a date range to generate the report
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm opacity-50">
          <CardHeader>
             <CardTitle className="text-lg">Purchase Report</CardTitle>
             <CardDescription>Coming soon</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-border/50 shadow-sm opacity-50">
          <CardHeader>
             <CardTitle className="text-lg">GST Report</CardTitle>
             <CardDescription>Coming soon</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
