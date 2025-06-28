declare global {
  interface Window {
    google: {
      maps: any;
    };
    initMap: () => void;
    gm_authFailure: () => void;
  }
}

export {};