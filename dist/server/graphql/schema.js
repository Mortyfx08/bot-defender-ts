"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const graphql_tag_1 = require("graphql-tag");
exports.typeDefs = (0, graphql_tag_1.gql) `
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
