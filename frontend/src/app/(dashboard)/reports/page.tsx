"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Loader2, 
  Download, 
  TrendingUp, 
  ShoppingBag,
  Calculator
} from "lucide-react";
import dayjs from "dayjs";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"sales" | "purchases" | "gst">("sales");
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD')
  });

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['reports', reportType, dateRange],
    queryFn: async () => await apiClient.get(`/reports/${reportType}?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const exportToCSV = () => {
    if (!reportData) return;
    
    let headers = "";
    let rows = "";
    
    if (reportType === "sales" || reportType === "purchases") {
      if (!reportData.data) return;
      headers = "Date,Number,Party,Status,Tax Amount,Total\n";
      rows = reportData.data.map((item: any) => 
        `${dayjs(item.date).format('YYYY-MM-DD')},${item.number},"${item.party?.name || ''}",${item.status},${item.taxAmount},${item.total}`
      ).join("\n");
    } else {
        headers = "Metric,Amount\n";
        rows = `Tax Out (Sales),${reportData.taxOut || 0}\nTax In (Purchases),${reportData.taxIn || 0}\nNet Payable,${reportData.netPayable || 0}`;
    }

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${reportType}_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Reports</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into your business performance and compliance
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!reportData || isLoading}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="pt-6">
          <Tabs value={reportType} onValueChange={(v: any) => setReportType(v)} className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <TabsList className="grid w-full lg:w-[400px] grid-cols-3">
                <TabsTrigger value="sales" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Sales
                </TabsTrigger>
                <TabsTrigger value="purchases" className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Purchases
                </TabsTrigger>
                <TabsTrigger value="gst" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  GST
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleGenerate} className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                  <Input 
                    type="date" 
                    className="h-9 text-sm"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[150px]">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">End Date</Label>
                  <Input 
                    type="date" 
                    className="h-9 text-sm"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
                <Button type="submit" size="sm" disabled={isLoading} className="h-9 px-6">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate
                </Button>
              </form>
            </div>

            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                <p className="animate-pulse">Generating {reportType} report...</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {/* Metrics Breakdown */}
                <div className="grid gap-4 md:grid-cols-3">
                  {reportType === "sales" && (
                    <>
                      <Card className="bg-emerald-50/30 border-emerald-100 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-emerald-900 uppercase">Total Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-emerald-600">₹{Number(reportData?.totalSales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <p className="text-[10px] text-emerald-600/70 mt-1 font-medium italic">Tax Inclusive</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-50/30 border-slate-100 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-slate-900 uppercase">Tax Collected</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-slate-700">₹{Number(reportData?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <p className="text-[10px] text-slate-600/70 mt-1 font-medium italic">Output Tax Liability</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50/30 border-blue-100 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-blue-900 uppercase">Invoice Count</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-700">{reportData?.invoiceCount || 0}</div>
                          <p className="text-[10px] text-blue-600/70 mt-1 font-medium italic">Sent to Parties</p>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {reportType === "purchases" && (
                    <>
                      <Card className="bg-rose-50/30 border-rose-100 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-rose-900 uppercase">Total Purchases</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-rose-600">₹{Number(reportData?.totalPurchases || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <p className="text-[10px] text-rose-600/70 mt-1 font-medium italic">Cost and Stock Value</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-slate-50/30 border-slate-100 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-slate-900 uppercase">Input Tax Paid</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-slate-700">₹{Number(reportData?.totalTax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                          <p className="text-[10px] text-slate-600/70 mt-1 font-medium italic">Eligible for Credit</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-indigo-50/30 border-indigo-100 shadow-none">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-indigo-900 uppercase">Status Tracking</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-indigo-700">Active</div>
                          <p className="text-[10px] text-indigo-600/70 mt-1 font-medium italic">Analyzing Vouchers</p>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {reportType === "gst" && (
                    <>
                      <Card className="bg-emerald-50/30 border-emerald-100 shadow-none border-l-4 border-l-emerald-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-emerald-900 uppercase">Output Tax (Sales)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-emerald-600">₹{Number(reportData?.taxOut || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-rose-50/30 border-rose-100 shadow-none border-l-4 border-l-rose-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-rose-900 uppercase">Input Tax (Purchases)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-rose-600">₹{Number(reportData?.taxIn || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-indigo-50/30 border-indigo-100 shadow-none border-l-4 border-l-indigo-500">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs font-semibold text-indigo-900 uppercase">Net Payable</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-indigo-700">₹{Number(reportData?.netPayable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>

                {/* Data Table */}
                {reportType !== "gst" && reportData?.data && (
                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="text-[11px] font-bold uppercase py-3">Date</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase py-3">Number</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase py-3">Party</TableHead>
                          <TableHead className="text-[11px] font-bold uppercase py-3">Status</TableHead>
                          <TableHead className="text-right text-[11px] font-bold uppercase py-3">Tax Amount</TableHead>
                          <TableHead className="text-right text-[11px] font-bold uppercase py-3">Grand Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.data.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                              No records found for the selected date range.
                            </TableCell>
                          </TableRow>
                        ) : (
                          reportData.data.map((item: any) => (
                            <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                              <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                {dayjs(item.date).format('DD MMM YYYY')}
                              </TableCell>
                              <TableCell className="font-semibold text-primary/80">
                                {item.number}
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate font-medium">
                                {item.party?.name || "N/A"}
                              </TableCell>
                              <TableCell>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  item.status === 'PAID' || item.status === 'RECEIVED' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-orange-50 text-orange-700 border-orange-100'
                                }`}>
                                  {item.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                ₹{Number(item.taxAmount).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-slate-900">
                                ₹{Number(item.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {reportType === "gst" && (
                   <div className="bg-muted/10 border border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="h-20 w-20 bg-primary/5 text-primary rounded-2xl rotate-3 flex items-center justify-center border border-primary/10 shadow-inner">
                         <Calculator className="h-10 w-10" />
                      </div>
                      <div className="max-w-md space-y-2">
                        <h3 className="text-2xl font-bold tracking-tight">GST Summary Generated</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                           Detailed breakdown of your tax liabilities for the period. 
                           Total Input Tax Credit (ITC) has been set off against Output Tax.
                        </p>
                      </div>
                      <div className="flex gap-3">
                         <Button onClick={exportToCSV} variant="default" className="shadow-lg shadow-primary/20">
                            Download Tax Ledger CSV
                         </Button>
                         <Button variant="outline" onClick={() => window.print()}>
                            Print Summary
                         </Button>
                      </div>
                   </div>
                )}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
