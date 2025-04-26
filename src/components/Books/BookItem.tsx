import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Book } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface BookItemProps {
  book: Book;
  onSelectForSale: (book: Book) => void;
}

const BookItem: React.FC<BookItemProps> = ({ book, onSelectForSale }) => {
  const isLowStock = book.quantity < 5;
  const isOutOfStock = book.quantity <= 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-2 h-14">{book.bookTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">Price:</span>
          <span className="font-medium">{formatCurrency(book.unitPrice)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">In Stock:</span>
          <span
            className={`font-medium ${
              isOutOfStock
                ? "text-destructive"
                : isLowStock
                ? "text-amber-500"
                : "text-green-600"
            }`}
          >
            {book.quantity}
          </span>
        </div>
        {book.note && (
          <p className="mt-4 text-sm italic text-muted-foreground">
            {book.note}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <button
          onClick={() => onSelectForSale(book)}
          disabled={isOutOfStock}
          className={`w-full py-2 px-4 rounded-md transition-colors ${
            isOutOfStock
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isOutOfStock ? "Out of Stock" : "Sell Book"}
        </button>
      </CardFooter>
    </Card>
  );
};

export default BookItem;
