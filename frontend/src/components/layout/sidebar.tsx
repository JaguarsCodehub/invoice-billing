"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard,
  PieChart,
  Settings,
  Calculator,
  FileSignature
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useUIStore } from "@/store/ui";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Quotations", href: "/quotations", icon: FileSignature },
  { name: "Parties", href: "/parties", icon: Users },
  { name: "Products & Inventory", href: "/inventory", icon: Package },
  { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Taxes", href: "/taxes", icon: Calculator },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className={cn(
      "flex h-full flex-col border-r bg-card text-card-foreground transition-all duration-300 ease-in-out",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "flex h-16 items-center border-b transition-all duration-300",
        sidebarCollapsed ? "justify-center px-0" : "px-6"
      )}>
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center text-primary-foreground shrink-0">
            BF
          </div>
          {!sidebarCollapsed && <span className="truncate">BillFlow</span>}
        </div>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className={cn("grid gap-1 px-2", !sidebarCollapsed && "px-4")}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-all duration-300",
                  sidebarCollapsed ? "justify-center px-0 w-10 mx-auto" : "px-3",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                title={sidebarCollapsed ? item.name : ""}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
