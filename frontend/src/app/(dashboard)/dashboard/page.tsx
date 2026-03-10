"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IndianRupee, Users, FileText, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => await apiClient.get('/dashboard')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
        <span className="text-muted-foreground font-medium">Loading metrics...</span>
      </div>
    );
  }

  const COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time insights into your business performance.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live Metrics
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md hover:border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <IndianRupee className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Number(stats?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="flex items-center gap-1 mt-1">
               <TrendingUp className="h-3 w-3 text-emerald-500" />
               <p className="text-[10px] text-muted-foreground">Lifetime Sales</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md hover:border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Profit</CardTitle>
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{Number(stats?.grossProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats?.netProfitMargin?.toFixed(1)}% Margin
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md hover:border-rose-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Payments</CardTitle>
            <div className="p-2 bg-rose-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">₹{Number(stats?.outstandingReceivables || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {stats?.unpaidInvoiceCount || 0} Open Invoices
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm transition-all hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Base</CardTitle>
            <div className="p-2 bg-slate-50 rounded-lg text-slate-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeParties || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Integrated across system
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Trend (Area Chart) */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="text-base">Revenue Trend</CardTitle>
                  <CardDescription className="text-xs">Daily sales activity (Last 7 Days)</CardDescription>
               </div>
               <div className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  +12% this week
               </div>
            </div>
          </CardHeader>
          <CardContent className="h-[280px] p-0 pt-4 pr-4">
            {stats?.weeklyRevenue && stats.weeklyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyRevenue} margin={{ top: 10, right: 0, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs">No trend data available</div>
            )}
          </CardContent>
        </Card>

        {/* Top Products (Vertical Bar) */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Selling Products</CardTitle>
            <CardDescription className="text-xs">By revenue contributors</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-4">
             {stats?.topSellingItems && stats.topSellingItems.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topSellingItems} layout="vertical" margin={{ left: -10, right: 30 }}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, width: 80 }} width={80} />
                     <Tooltip cursor={{fill: 'transparent'}} />
                     <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                        {stats.topSellingItems.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground italic text-xs">No product stats available</div>
             )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Growth Comparison</CardTitle>
            <CardDescription className="text-xs">Monthly revenue vs expenses (Last 6 Months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] mt-4">
            {stats?.chartData && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} iconType="circle" />
                  <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  <Bar dataKey="expenses" name="Expenses" fill="#fca5a5" radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-t border-dashed mt-4 text-xs">
                <TrendingUp className="mb-2 h-6 w-6 opacity-20" />
                <p>No growth metrics to display</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border/50 shadow-sm bg-slate-50/30">
          <CardHeader>
            <CardTitle className="text-base text-slate-800">Activity Stream</CardTitle>
            <CardDescription className="text-xs">Timeline of latest transactions</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 px-2">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-6 relative">
                 <div className="absolute left-[7px] top-1 bottom-1 w-[1px] bg-slate-200" />
                {stats.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="relative pl-6">
                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary shadow-sm ring-2 ring-primary/20" />
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                        <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-muted-foreground shadow-sm">
                           {dayjs(activity.date).format('DD MMM')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground border-t border-dashed mt-4 text-xs">
                Timeline is currently empty.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
