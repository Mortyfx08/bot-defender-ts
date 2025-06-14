import { BotDetectionResult } from '../backend/src/services/botDetection';

declare global {
  namespace Express {
    interface Request {
      session?: {
        shop?: string;
      };
      botDetection?: BotDetectionResult;
    }
  }
} 