"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, History, ArrowUpRight, ArrowDownLeft, Scale } from "lucide-react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";

interface PartyHistorySheetProps {
  party: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartyHistorySheet({ party, isOpen, onOpenChange }: PartyHistorySheetProps) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["party-history", party?.id],
    queryFn: () => apiClient.get(`/parties/${party.id}/history`),
    enabled: !!party?.id && isOpen,
  });

  const getEntryIcon = (type: string) => {
    switch (type) {
      case "INVOICE":
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
      case "PAYMENT":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "OPENING_BALANCE":
        return <Scale className="h-4 w-4 text-blue-500" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full">
        <SheetHeader className="pb-6 border-b">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <SheetTitle>Ledger History</SheetTitle>
          </div>
          <SheetDescription>
            Audit trail for <span className="font-semibold text-foreground">{party?.name}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 h-full flex flex-col">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Outstanding</p>
              <p className={`text-xl font-bold mt-1 ${
                Number(party?.outstanding || 0) >= 0 
                  ? "text-green-600" 
                  : "text-destructive"
              }`}>
                ₹{Math.abs(Number(party?.outstanding || 0)).toFixed(2)}
                <span className="text-xs font-normal ml-1">
                  {Number(party?.outstanding || 0) >= 0 ? "Dr" : "Cr"}
                </span>
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Opening Balance</p>
              <p className="text-xl font-bold mt-1">₹{Math.abs(Number(party?.openingBalance || 0)).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Fetching ledger history...</p>
              </div>
            ) : history?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground border-2 border-dashed rounded-lg">
                <History className="h-10 w-10 mb-2 opacity-20" />
                <p>No history found for this party.</p>
              </div>
            ) : (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-24">Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry: any) => (
                      <TableRow key={entry.id} className="group cursor-default">
                        <TableCell className="text-xs text-muted-foreground">
                          {dayjs(entry.date).format("DD MMM YY")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {getEntryIcon(entry.type)}
                              <span className="font-medium text-sm">{entry.type.replace("_", " ")}</span>
                            </div>
                            {entry.reference && (
                              <span className="text-[10px] text-muted-foreground ml-6">Ref: {entry.reference}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={entry.amount >= 0 ? "text-green-600" : "text-destructive"}>
                            ₹{Math.abs(entry.amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-sm">
                          ₹{Math.abs(entry.balance).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
