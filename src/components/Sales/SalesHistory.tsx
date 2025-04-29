
import React, { useState, useEffect } from "react";
import { fetchAllSales, updateSalePaymentStatus } from "@/lib/googleSheetsApi";
import { Sale } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const SalesHistory: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const allSales = await fetchAllSales();
      
      // Sort by date, newest first
      allSales.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setSales(allSales);
    } catch (error) {
      console.error("Error loading sales:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load sales history.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleUpdatePaymentStatus = async (saleId: string, newStatus: "paid" | "pending") => {
    try {
      await updateSalePaymentStatus(saleId, newStatus);
      
      // Update local state
      setSales(prev => prev.map(sale => 
        sale.saleId === saleId 
          ? { ...sale, paymentStatus: newStatus } 
          : sale
      ));
      
      toast({
        title: "Status Updated",
        description: `Payment status updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payment status.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sales History</h2>
        <Button variant="outline" size="sm" onClick={loadSales}>
          Refresh
        </Button>
      </div>
      
      {sales.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No sales records found.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.saleId}>
                  <TableCell>
                    {new Date(sale.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{sale.saleId}</TableCell>
                  <TableCell>{sale.bookTitle || 'Unknown Book'}</TableCell>
                  <TableCell>{sale.quantitySold}</TableCell>
                  <TableCell>{formatCurrency(sale.totalPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={sale.paymentStatus === "paid" ? "success" : "destructive"}>
                      {sale.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.clientName || (sale.paymentStatus === "pending" ? "Unknown" : "-")}
                  </TableCell>
                  <TableCell className="text-right">
                    {sale.paymentStatus === "pending" ? (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUpdatePaymentStatus(sale.saleId, "paid")}
                      >
                        Mark Paid
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleUpdatePaymentStatus(sale.saleId, "pending")}
                      >
                        Mark Pending
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
