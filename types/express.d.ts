declare global {
  namespace Express {
    interface Request {
      shop?: string;
      shopifySession?: any;
      botDetection?: any;
    }
  }
}

export {}; 