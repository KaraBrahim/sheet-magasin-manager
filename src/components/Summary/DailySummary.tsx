import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchTodaySales, generateDailySummary } from "@/lib/googleSheetsApi";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Sale } from "@/types";
import { Loader2 } from "lucide-react";

interface DailySummaryProps {
  onSummaryGenerated: () => void;
}

const DailySummary: React.FC<DailySummaryProps> = ({ onSummaryGenerated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isSummaryShown, setIsSummaryShown] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    try {
      setIsLoading(true);

      // Fetch today's sales
      const todaySales = await fetchTodaySales();
      setSales(todaySales);

      // Generate and update summary in the sheet
      const summary = await generateDailySummary();
      setTotalAmount(summary.totalSales);

      setIsSummaryShown(true);

      toast({
        title: "Summary Generated",
        description: `Daily summary for ${summary.date} has been created.`,
      });

      onSummaryGenerated();
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate daily summary. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Sales Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {isSummaryShown ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Today's Sales</h3>
              <p>
                {sales.length} transaction{sales.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="border rounded-md p-4 bg-muted/30">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Total Revenue</p>
                <p className="text-4xl font-bold">
                  {formatCurrency(totalAmount)}
                </p>
                <p className="text-muted-foreground mt-2">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {sales.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Transactions</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {sales.map((sale) => (
                    <div
                      key={sale.saleId}
                      className="flex justify-between border-b pb-2"
                    >
                      <div>
                        <p className="text-sm">{sale.saleId}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(sale.totalPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsSummaryShown(false)}
            >
              Close Summary
            </Button>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="mb-4">Generate a summary of all sales for today</p>
            <p className="text-sm text-muted-foreground mb-6">
              This will update the Summary sheet with today's total sales
            </p>
            <Button
              onClick={handleGenerateSummary}
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Daily Summary"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailySummary;
