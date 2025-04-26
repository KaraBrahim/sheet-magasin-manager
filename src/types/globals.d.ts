
// Add Google Identity Services typings
interface Window {
  gapi: any;
  google: {
    accounts: {
      oauth2: {
        initTokenClient: (config: any) => any;
        revoke: (token: string, callback?: () => void) => void;
      }
    }
  };
}
