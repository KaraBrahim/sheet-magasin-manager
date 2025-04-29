
import { Book, Sale, DailySummary, Donation } from '../types';

// Google API constants
const API_KEY = 'AIzaSyAZL8oW4PZZjuhMfsRZuyOw9DP9Xj0nt-M';
const CLIENT_ID = '607196946730-cue47gq9kcoim4017revjqflv94n3na9.apps.googleusercontent.com';
const SPREADSHEET_ID = '1nfgmUZcIasQf_smM5sA7D1yMcrUzGxvoVsl5royv1JI';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

const SHEETS = {
  BOOKS: 'Books',
  SALES: 'Sales',
  SUMMARY: 'Summary',
  DONATIONS: 'Donations'
};

// Track loading state
let isApiLoaded = false;
let tokenClient: any = null;

// Load the Google API client library
export const loadGoogleApi = async () => {
  if (isApiLoaded) {
    return;
  }
  
  return new Promise<void>((resolve, reject) => {
    // Load the Google Identity Services script
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
      // Load the Google API script
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = async () => {
        try {
          await new Promise<void>((res, rej) => {
            window.gapi.load('client', { callback: res, onerror: rej });
          });
          
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
          
          // Initialize the token client
          tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: () => {} // We'll handle the callback manually
          });
          
          isApiLoaded = true;
          resolve();
        } catch (error) {
          console.error('Error initializing Google API:', error);
          reject(error);
        }
      };
      gapiScript.onerror = (error) => reject(error);
      document.body.appendChild(gapiScript);
    };
    gisScript.onerror = (error) => reject(error);
    document.body.appendChild(gisScript);
  });
};

// Authentication functions
export const isSignedIn = () => {
  try {
    return window.gapi.client.getToken() !== null;
  } catch (error) {
    console.error("Error checking sign-in status:", error);
    return false;
  }
};

export const signIn = async (checkOnly = false) => {
  if (!tokenClient) {
    throw new Error('Token client not initialized');
  }
  
  // If we're just checking status and user is already signed in, get user info
  if (checkOnly && isSignedIn()) {
    try {
      const token = window.gapi.client.getToken();
      const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: {
          'Authorization': `Bearer ${token.access_token}`
        }
      });
      
      const userInfo = await response.json();
      
      return {
        getEmail: () => userInfo.email,
        getName: () => userInfo.name,
        getImageUrl: () => userInfo.picture
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }
  
  return new Promise<{getEmail: () => string, getName: () => string, getImageUrl: () => string}>((resolve, reject) => {
    try {
      // To prevent popup blockers, we'll only request a token when a user interaction has occurred
      tokenClient.callback = async (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(tokenResponse);
          return;
        }
        
        try {
          // Get user profile from People API
          const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: {
              'Authorization': `Bearer ${tokenResponse.access_token}`
            }
          });
          
          const userInfo = await response.json();
          
          resolve({
            getEmail: () => userInfo.email,
            getName: () => userInfo.name,
            getImageUrl: () => userInfo.picture
          });
        } catch (error) {
          console.error("Error fetching user profile:", error);
          reject(error);
        }
      };
      
      // Prompt the user to select a Google account and authorize the app
      if (checkOnly) {
        // If just checking, don't show the popup again
        tokenClient.requestAccessToken({prompt: ''});
      } else {
        // If new sign-in, show the consent screen
        tokenClient.requestAccessToken({prompt: 'consent'});
      }
    } catch (error) {
      console.error("Error signing in:", error);
      reject(error);
    }
  });
};

export const signOut = async () => {
  try {
    const token = window.gapi.client.getToken();
    if (token !== null) {
      window.google.accounts.oauth2.revoke(token.access_token);
      window.gapi.client.setToken(null);
    }
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Data functions 
export const fetchBooks = async (): Promise<Book[]> => {
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.BOOKS}!A2:F`  // Updated to include Author and Category (column F)
    });

    const rows = response.result.values || [];
    return rows.map((row) => ({
      bookId: row[0],
      bookTitle: row[1],
      quantity: Number(row[2] || 0),
      unitPrice: Number(row[3] || 0),
      author: row[4] || '',
      category: row[5] || '',
      note: ''
    }));
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }
};

export const updateBookQuantity = async (bookId: string, newQuantity: number): Promise<void> => {
  try {
    // First, find the row index of the book
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.BOOKS}!A2:A`
    });

    const rows = response.result.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === bookId);
    
    if (rowIndex === -1) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    // Update the quantity in the sheet (row + 2 because we start at A2)
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.BOOKS}!C${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[newQuantity]]
      }
    });
  } catch (error) {
    console.error("Error updating book quantity:", error);
    throw error;
  }
};

export const addSale = async (sale: Omit<Sale, 'saleId'>): Promise<string> => {
  try {
    // Generate a new sale ID
    const salesResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SALES}!A2:A`
    });

    const salesRows = salesResponse.result.values || [];
    const lastSaleId = salesRows.length > 0 ? salesRows[salesRows.length - 1][0] : 'S000';
    const newSaleNumber = parseInt(lastSaleId.substring(1)) + 1;
    const newSaleId = `S${newSaleNumber.toString().padStart(3, '0')}`;

    // Add the sale to the sheet
    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SALES}!A2`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[
          newSaleId, 
          sale.bookId,
          sale.quantitySold,
          sale.discount,
          sale.totalPrice,
          sale.timestamp,
          sale.clientName || "", // Include client name
          sale.paymentStatus || "paid"
        ]]
      }
    });

    return newSaleId;
  } catch (error) {
    console.error("Error adding sale:", error);
    throw error;
  }
};

export const updateSalePaymentStatus = async (saleId: string, paymentStatus: "paid" | "pending"): Promise<void> => {
  try {
    // First, find the row index of the sale
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SALES}!A2:A`
    });

    const rows = response.result.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === saleId);
    
    if (rowIndex === -1) {
      throw new Error(`Sale with ID ${saleId} not found`);
    }

    // Update the payment status in the sheet (row + 2 because we start at A2)
    await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SALES}!G${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[paymentStatus]]
      }
    });
  } catch (error) {
    console.error("Error updating sale payment status:", error);
    throw error;
  }
};

export const fetchAllSales = async (): Promise<Sale[]> => {
  try {
    const [salesResponse, booksResponse] = await Promise.all([
      window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.SALES}!A2:H` // Updated to include clientName (column G) and status (column H)
      }),
      window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.BOOKS}!A2:B`
      })
    ]);

    const salesRows = salesResponse.result.values || [];
    const booksMap = new Map();
    
    (booksResponse.result.values || []).forEach(row => {
      booksMap.set(row[0], row[1]);
    });
    
    return salesRows.map(row => ({
      saleId: row[0],
      bookId: row[1],
      bookTitle: booksMap.get(row[1]) || 'Unknown Book',
      quantitySold: Number(row[2] || 0),
      discount: Number(row[3] || 0),
      totalPrice: Number(row[4] || 0),
      timestamp: row[5],
      clientName: row[6] || "",
      paymentStatus: row[7] || "paid"
    }));
  } catch (error) {
    console.error("Error fetching sales:", error);
    throw error;
  }
};

export const fetchTodaySales = async (): Promise<Sale[]> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format
    const allSales = await fetchAllSales();
    
    return allSales.filter(sale => {
      // Extract date part of ISO string for comparison
      const saleDate = sale.timestamp.split('T')[0];
      return saleDate === today;
    });
  } catch (error) {
    console.error("Error fetching today's sales:", error);
    throw error;
  }
};

export const generateDailySummary = async (): Promise<DailySummary> => {
  try {
    const sales = await fetchTodaySales();
    const totalSales = sales.reduce((sum, sale) => sum + Number(sale.totalPrice || 0), 0);
    const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format

    // Add or update the summary for today
    const summaryResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SUMMARY}!A2:B`
    });

    const summaryRows = summaryResponse.result.values || [];
    const existingRowIndex = summaryRows.findIndex(row => row[0] === today);

    if (existingRowIndex !== -1) {
      // Update existing summary
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.SUMMARY}!B${existingRowIndex + 2}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[totalSales]]
        }
      });
    } else {
      // Add new summary
      await window.gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.SUMMARY}!A2`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: [[
            today,
            totalSales
          ]]
        }
      });
    }

    return {
      date: today,
      totalSales
    };
  } catch (error) {
    console.error("Error generating daily summary:", error);
    throw error;
  }
};

// Donations functions
export const addDonation = async (donation: Omit<Donation, 'donationId'>): Promise<string> => {
  try {
    // Check if Donations sheet exists and create it if not
    try {
      await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.DONATIONS}!A1`
      });
    } catch (error) {
      // Create the Donations sheet with headers
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: SHEETS.DONATIONS
                }
              }
            }
          ]
        }
      });

      // Add headers
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.DONATIONS}!A1:E1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [["DonationID", "DonorName", "Amount", "Timestamp", "Note"]]
        }
      });
    }

    // Generate a new donation ID
    const donationsResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.DONATIONS}!A2:A`
    });

    const donationsRows = donationsResponse.result.values || [];
    const lastDonationId = donationsRows.length > 0 ? donationsRows[donationsRows.length - 1][0] : 'D000';
    const newDonationNumber = parseInt(lastDonationId.substring(1)) + 1;
    const newDonationId = `D${newDonationNumber.toString().padStart(3, '0')}`;

    // Add the donation to the sheet
    await window.gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.DONATIONS}!A2`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[
          newDonationId, 
          donation.donorName,
          donation.amount,
          donation.timestamp,
          donation.note || ''
        ]]
      }
    });

    return newDonationId;
  } catch (error) {
    console.error("Error adding donation:", error);
    throw error;
  }
};

export const fetchDonations = async (): Promise<Donation[]> => {
  try {
    try {
      const response = await window.gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEETS.DONATIONS}!A2:E`
      });
  
      const rows = response.result.values || [];
      return rows.map((row) => ({
        donationId: row[0],
        donorName: row[1],
        amount: Number(row[2] || 0),
        timestamp: row[3],
        note: row[4] || ''
      }));
    } catch (error) {
      // If the sheet doesn't exist yet, return an empty array
      return [];
    }
  } catch (error) {
    console.error("Error fetching donations:", error);
    throw error;
  }
};
