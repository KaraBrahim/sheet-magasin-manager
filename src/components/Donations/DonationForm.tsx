
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addDonation } from "@/lib/googleSheetsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DonationForm: React.FC = () => {
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!donorName || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please provide a valid name and amount.",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const donation = {
        donorName,
        amount: parseFloat(amount),
        timestamp: new Date().toISOString(),
        note,
      };
      
      await addDonation(donation);
      
      // Reset the form
      setDonorName("");
      setAmount("");
      setNote("");
      
      toast({
        title: "Donation Added",
        description: "Thank you for the donation!",
      });
    } catch (error) {
      console.error("Error adding donation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add donation. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Donation</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="donorName">Donor Name</Label>
            <Input
              id="donorName"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Enter donor name"
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (DZD)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (Optional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this donation"
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Add Donation"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default DonationForm;
