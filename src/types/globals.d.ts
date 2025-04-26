
// Type declaration for global Google API
interface Window {
  gapi: any;
}

// Additional type definitions for Google API
interface GapiClient {
  sheets: {
    spreadsheets: {
      values: {
        get: (params: any) => Promise<any>;
        update: (params: any) => Promise<any>;
        append: (params: any) => Promise<any>;
      }
    }
  }
}

// Extend gapi namespace
declare namespace gapi {
  const client: GapiClient;
  
  namespace auth2 {
    function getAuthInstance(): {
      isSignedIn: { get(): boolean };
      signIn(): Promise<any>;
      signOut(): Promise<void>;
      currentUser: {
        get(): {
          getBasicProfile(): {
            getEmail(): string;
            getName(): string;
            getImageUrl(): string;
          }
        }
      }
    }
  }
}
