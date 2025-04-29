
import React, { useState, useEffect } from "react";
import { Book } from "@/types";
import { useAuth } from "@/context/AuthContext";
import GoogleAuth from "@/components/Auth/GoogleAuth";
import BookList from "@/components/Books/BookList";
import SaleForm from "@/components/Sales/SaleForm";
import SalesHistory from "@/components/Sales/SalesHistory";
import Donations from "@/components/Donations/Donations";
import DailySummary from "@/components/Summary/DailySummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
  };

  const handleCloseForm = () => {
    setSelectedBook(null);
  };

  const handleSaleComplete = () => {
    setSelectedBook(null);
    setRefresh((prev) => prev + 1);
  };

  const handleSummaryGenerated = () => {
    setRefresh((prev) => prev + 1);
  };

  const handleDonationAdded = () => {
    setRefresh((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b py-4 px-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">
            Book Store Manager
          </h1>
          <GoogleAuth />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isAuthenticated ? (
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
            <div className="lg:col-span-2">
              <Tabs defaultValue="books" className="space-y-6">
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="books">Inventory</TabsTrigger>
                  <TabsTrigger value="sales-history">Sales History</TabsTrigger>
                  <TabsTrigger value="donations">Donations</TabsTrigger>
                  <TabsTrigger value="summary">Daily Summary</TabsTrigger>
                </TabsList>

                <TabsContent value="books">
                  <div className="mb-4 relative">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search books by title, author, or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <BookList
                    onSelectBook={handleBookSelect}
                    searchTerm={searchTerm}
                    key={`books-${refresh}`}
                  />
                </TabsContent>

                <TabsContent value="sales-history">
                  <SalesHistory key={`sales-history-${refresh}`} />
                </TabsContent>

                <TabsContent value="donations">
                  <Donations onDonationAdded={handleDonationAdded} key={`donations-${refresh}`} />
                </TabsContent>

                <TabsContent value="summary">
                  <DailySummary
                    onSummaryGenerated={handleSummaryGenerated}
                    key={`summary-${refresh}`}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              Welcome to Book Store Manager
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Sign in with your Google account to manage your book inventory and
              sales.
            </p>
            <GoogleAuth />
          </div>
        )}
      </main>

      {/* Modal Sale Form */}
      {selectedBook && (
        <SaleForm
          selectedBook={selectedBook}
          onClose={handleCloseForm}
          onSaleComplete={handleSaleComplete}
        />
      )}

      <footer className="border-t py-6 mt-20 text-center text-muted-foreground">
        <p>Book Store Manager &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default Index;
