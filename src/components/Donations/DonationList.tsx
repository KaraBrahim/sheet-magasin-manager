
import React, { useState, useEffect } from "react";
import { fetchDonations } from "@/lib/googleSheetsApi";
import { Donation } from "@/types";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const DonationList: React.FC = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadDonations = async () => {
    try {
      setIsLoading(true);
      const allDonations = await fetchDonations();
      
      // Sort by date, newest first
      allDonations.sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      setDonations(allDonations);
    } catch (error) {
      console.error("Error loading donations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load donations.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const totalDonations = donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Donations</h2>
        <Button variant="outline" size="sm" onClick={loadDonations}>
          Refresh
        </Button>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30 text-center mb-4">
        <p className="text-muted-foreground mb-1">Total Donations</p>
        <p className="text-3xl font-bold">{formatCurrency(totalDonations)}</p>
      </div>
      
      {donations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No donations recorded yet.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Donor</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations.map((donation) => (
                <TableRow key={donation.donationId}>
                  <TableCell>
                    {new Date(donation.timestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{donation.donorName}</TableCell>
                  <TableCell>{formatCurrency(donation.amount)}</TableCell>
                  <TableCell>{donation.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default DonationList;
