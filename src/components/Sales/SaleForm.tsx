
import React, { useState } from 'react';
import { Book, Sale } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { addSale, updateBookQuantity } from '@/lib/googleSheetsApi';
import { Loader2, X } from 'lucide-react';

interface SaleFormProps {
  selectedBook: Book | null;
  onClose: () => void;
  onSaleComplete: () => void;
}

const SaleForm: React.FC<SaleFormProps> = ({ 
  selectedBook, 
  onClose,
  onSaleComplete
}) => {
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  if (!selectedBook) return null;

  const maxQuantity = selectedBook.quantity;
  const basePrice = selectedBook.unitPrice * quantity;
  const discountAmount = (basePrice * discount) / 100;
  const finalPrice = basePrice - discountAmount;

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setDiscount(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity > maxQuantity) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Only ${maxQuantity} copies available.`,
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Create the sale record
      const newSale: Omit<Sale, 'saleId'> = {
        bookId: selectedBook.bookId,
        quantitySold: quantity,
        discount: discount,
        totalPrice: finalPrice,
        timestamp: new Date().toISOString()
      };
      
      // Add the sale to the sheet
      await addSale(newSale);
      
      // Update the book quantity
      const newQuantity = selectedBook.quantity - quantity;
      await updateBookQuantity(selectedBook.bookId, newQuantity);
      
      toast({
        title: "Sale Completed",
        description: `Sold ${quantity} ${quantity > 1 ? 'copies' : 'copy'} of "${selectedBook.bookTitle}"`,
      });
      
      // Reset the form and close it
      onSaleComplete();
    } catch (error) {
      console.error('Error processing sale:', error);
      toast({
        variant: "destructive",
        title: "Sale Failed",
        description: "There was a problem recording this sale. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Record Sale</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{selectedBook.bookTitle}</h3>
            <p className="text-muted-foreground text-sm">ID: {selectedBook.bookId}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity ({maxQuantity} available)</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={handleQuantityChange}
              disabled={isProcessing}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={handleDiscountChange}
              disabled={isProcessing}
            />
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <span>Base Price:</span>
              <span>{formatCurrency(basePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount ({discount}%):</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total:</span>
              <span>{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Complete Sale'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SaleForm;
