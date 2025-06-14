import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

// Define the types for our bot stats data
interface BotStats {
  blockedBots: number;
  totalAttempts: number;
  healthScore: number;
  recentAttacks: Array<{
    ip: string;
    timestamp: string;
    userAgent: string;
    blocked: boolean;
  }>;
}

interface BotStatsResponse {
  getBotStats: BotStats;
}

// Define the GraphQL query
const GET_BOT_STATS = gql`
  query GetBotStats {
    getBotStats {
      totalBlockedBots
      totalScanAttempts
      lastScan
      falsePositives
      healthScore
      recentAttacks {
        ip
        timestamp
        userAgent
        blocked
      }
    }
  }
`;

// Define the hook parameters
interface UseAppQueryParams {
  query: string;
  variables?: {
    shopId: string;
  };
}

// Create the hook
export const useAppQuery = () => {
  return useQuery(GET_BOT_STATS, {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });
};
