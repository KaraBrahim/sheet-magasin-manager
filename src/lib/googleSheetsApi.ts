
import { Book, Sale, DailySummary } from '../types';

// Google API constants
const API_KEY = 'AIzaSyAZL8oW4PZZjuhMfsRZuyOw9DP9Xj0nt-M';
const CLIENT_ID = '607196946730-cue47gq9kcoim4017revjqflv94n3na9.apps.googleusercontent.com';
const SPREADSHEET_ID = '1nfgmUZcIasQf_smM5sA7D1yMcrUzGxvoVsl5royv1JI';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

const SHEETS = {
  BOOKS: 'Books',
  SALES: 'Sales',
  SUMMARY: 'Summary' // Note: keeping the typo as per the user's sheet name
};

// Track loading state
let isApiLoaded = false;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;

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
          tokenClient = google.accounts.oauth2.initTokenClient({
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
  return window.gapi.client.getToken() !== null;
};

export const signIn = async () => {
  if (!tokenClient) {
    throw new Error('Token client not initialized');
  }
  
  return new Promise<{getEmail: () => string, getName: () => string, getImageUrl: () => string}>((resolve, reject) => {
    try {
      tokenClient!.callback = async (tokenResponse) => {
        if (tokenResponse.error) {
          reject(tokenResponse);
          return;
        }
        
        try {
          const response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: {
              'Authorization': `Bearer ${tokenResponse.access_token}`
            }
          });
    
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
    
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
      tokenClient!.requestAccessToken({prompt: 'consent'});
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
      google.accounts.oauth2.revoke(token.access_token);
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
      range: `${SHEETS.BOOKS}!A2:E`
    });
    console.log(response);
    const rows = response.result.values || [];
    return rows.map((row) => ({
      bookId: row[0],
      bookTitle: row[1],
      quantity: Number(row[2]),
      unitPrice: row[3],
      note: row[4] || ''
    }));
    
  } catch (error) {
    console.error("Error fetching books:", error);
    throw error;
  }finally{
    
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
          sale.timestamp
        ]]
      }
    });

    return newSaleId;
  } catch (error) {
    console.error("Error adding sale:", error);
    throw error;
  }
};

export const fetchTodaySales = async (): Promise<Sale[]> => {
  try {
    const today = new Date().toLocaleDateString('en-US');
    
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SALES}!A2:F`
    });
    

    const rows = response.result.values || [];
    return rows
      .filter(row => {
        const saleDate = new Date(row[5]).toLocaleDateString('en-US');
        console.log(saleDate)
        return saleDate === today;
      })
      .map(row => ({
        saleId: row[0],
        bookId: row[1],
        quantitySold: (row[2]),
        discount: row[3],
        totalPrice: (row[4]),
        timestamp: row[5]
      }));
  } catch (error) {
    console.error("Error fetching today's sales:", error);
    throw error;
  }
};

export const generateDailySummary = async (): Promise<DailySummary> => {
  try {
    const sales = await fetchTodaySales();
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
    const today = new Date().toLocaleDateString('en-US');

    // Add or update the summary for today
    const summaryResponse = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEETS.SUMMARY}!A2:B`
    });

    const summaryRows = summaryResponse.result.values || [];
    const existingRowIndex = summaryRows.findIndex(row => 
      new Date(row[0]).toLocaleDateString('en-US') === today
    );

    if (existingRowIndex !== -1) {
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
