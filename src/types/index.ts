
export interface Book {
  bookId: string;
  bookTitle: string;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface Sale {
  saleId: string;
  bookId: string;
  quantitySold: number;
  discount: number;
  totalPrice: number;
  timestamp: string;
  paymentStatus?: "paid" | "pending";
  bookTitle?: string;
}

export interface Donation {
  donationId: string;
  donorName: string;
  amount: number;
  timestamp: string;
  note?: string;
}

export interface DailySummary {
  date: string;
  totalSales: number;
}

export interface User {
  email: string;
  name: string;
  picture?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}
