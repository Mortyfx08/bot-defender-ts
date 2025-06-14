import { Request } from 'express';
import { RedisService } from '../services/redis';

interface BotAnalysis {
  isBot: boolean;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  requestCount: number;
  ipReputation: number;
}

// Enhanced bot patterns with specific user agents
const BOT_USER_AGENTS = [
  'Googlebot', 'Bingbot', 'YandexBot', 
  'DuckDuckBot', 'Baiduspider', 'Facebot',
  'Python-urllib', 'curl/', 'libwww-perl',
  'masscan', 'zgrab', 'nmap'
];

// Enhanced bot patterns with regex
const botPatterns = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /java/i,
  /perl/i,
  /ruby/i,
  /php/i,
  /headless/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /chrome-lighthouse/i,
  /apache-httpclient/i,
  /okhttp/i,
  /axios/i,
  /masscan/i,
  /zgrab/i,
  /nmap/i,
  /sqlmap/i,
  /nikto/i,
  /gobuster/i,
  /dirbuster/i,
  /wfuzz/i,
  /burp/i,
  /zap/i
];

// Enhanced suspicious patterns
const suspiciousPatterns = [
  /wp-content/i,
  /wp-admin/i,
  /wp-includes/i,
  /administrator/i,
  /admin/i,
  /login/i,
  /wp-login/i,
  /xmlrpc/i,
  /wp-json/i,
  /wp-config/i,
  /backup/i,
  /database/i,
  /sql/i,
  /phpmyadmin/i,
  /config/i,
  /setup/i,
  /install/i,
  /debug/i,
  /test/i,
  /api-docs/i
];

// Enhanced malicious paths
const MALICIOUS_PATHS = [
  '/wp-admin',
  '/phpmyadmin',
  '/.env',
  '/admin',
  '/backup',
  '/sql',
  '/wp-login.php',
  '/administrator',
  '/wp-json',
  '/xmlrpc.php',
  '/wp-config.php',
  '/database',
  '/setup',
  '/install',
  '/debug',
  '/test',
  '/api-docs',
  '/.git',
  '/.svn',
  '/.htaccess',
  '/.htpasswd',
  '/.well-known',
  '/.vscode',
  '/.idea',
  '/.DS_Store',
  '/.gitignore',
  '/.npmrc',
  '/.yarnrc',
  '/.env.local',
  '/.env.development',
  '/.env.production',
  '/.env.test',
  '/.env.staging',
  '/.env.backup',
  '/.env.old',
  '/.env.save',
  '/.env.swp',
  '/.env.swo',
  '/.env.bak',
  '/.env.tmp',
  '/.env.temp',
  '/.env.orig',
  '/.env.dist',
  '/.env.example',
  '/.env.sample',
  '/.env.default'
];

export async function analyzeRequest(req: Request): Promise<BotAnalysis> {
  const userAgent = req.headers['user-agent'] || '';
  const ip = Array.isArray(req.headers['x-forwarded-for']) 
    ? req.headers['x-forwarded-for'][0] 
    : (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  const path = req.path;

  // Get request count from Redis
  const redisService = await RedisService.getInstance();
  const requestKey = `requests:${ip}`;
  const requestCount = await redisService.get(requestKey) || '0';
  await redisService.set(requestKey, (parseInt(requestCount) + 1).toString(), 60); // 1 minute window

  // Check if IP is in threat feed blocklist
  const isBlockedIP = await redisService.isBlocked(ip);
  const ipReputation = isBlockedIP ? 0 : 100;

  // Enhanced bot detection
  const isKnownBotUA = BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
  const isBotUA = isKnownBotUA || botPatterns.some(pattern => pattern.test(userAgent));
  const isSuspiciousUA = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  const isMaliciousPath = MALICIOUS_PATHS.some(maliciousPath => path.includes(maliciousPath));

  // Determine severity and reason
  let severity: 'high' | 'medium' | 'low' = 'low';
  let reason = '';

  // High severity conditions
  if (isBotUA || isMaliciousPath || ipReputation === 0) {
    severity = 'high';
    if (isKnownBotUA) reason = `Known bot user agent detected: ${userAgent}`;
    else if (isBotUA) reason = 'Bot user agent detected';
    else if (isMaliciousPath) reason = 'Malicious path detected';
    else if (ipReputation === 0) reason = 'IP found in threat feed blocklist';
  }
  // Medium severity conditions
  else if (isSuspiciousUA || parseInt(requestCount) > 100) {
    severity = 'medium';
    if (isSuspiciousUA) reason = 'Suspicious user agent detected';
    else reason = 'High request rate detected';
  }
  // Low severity conditions
  else if (parseInt(requestCount) > 50) {
    severity = 'low';
    reason = 'Elevated request rate';
  }

  return {
    isBot: isBotUA || isSuspiciousUA || isMaliciousPath || ipReputation === 0 || parseInt(requestCount) > 50,
    severity,
    reason,
    requestCount: parseInt(requestCount),
    ipReputation
  };
} 