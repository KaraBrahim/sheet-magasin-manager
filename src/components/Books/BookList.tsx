import React, { useState, useEffect } from "react";
import { Book } from "@/types";
import { fetchBooks } from "@/lib/googleSheetsApi";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import BookItem from "./BookItem";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface BookListProps {
  onSelectBook: (book: Book) => void;
}

const BookList: React.FC<BookListProps> = ({ onSelectBook }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const bookData = await fetchBooks();
        setBooks(bookData);
        setFilteredBooks(bookData);
      } catch (error) {
        console.error("Failed to load books:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load book inventory. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, [toast]);

  useEffect(() => {
    const filtered = books.filter(
      (book) =>
        book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.bookId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBooks(filtered);
  }, [searchTerm, books]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background pt-4 pb-2">
        <Input
          type="search"
          placeholder="Search books by title or ID..."
          value={searchTerm}
          onChange={handleSearch}
          className="max-w-md"
        />
      </div>

      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <BookItem
              key={book.bookId}
              book={book}
              onSelectForSale={onSelectBook}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex justify-center items-center h-32">
            {searchTerm ? (
              <p className="text-muted-foreground">
                No books match your search
              </p>
            ) : (
              <p className="text-muted-foreground">No books in inventory</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookList;
