"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAppQuery = void 0;
const client_1 = require("@apollo/client");
const client_2 = require("@apollo/client");
// Define the GraphQL query
const GET_BOT_STATS = (0, client_2.gql) `
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
// Create the hook
const useAppQuery = () => {
    return (0, client_1.useQuery)(GET_BOT_STATS, {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
    });
};
exports.useAppQuery = useAppQuery;
