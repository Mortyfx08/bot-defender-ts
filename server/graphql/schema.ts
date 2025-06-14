import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type BotStats {
    totalBlockedBots: Int!
    totalScanAttempts: Int!
    lastScan: String!
    falsePositives: Int!
    healthScore: Float!
    recentAttacks: [Attack!]!
  }

  type Attack {
    ip: String!
    timestamp: String!
    userAgent: String!
    blocked: Boolean!
  }

  type Query {
    getBotStats: BotStats!
  }
`; 