"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("../services/redis");
const userAgentAnalysis_1 = require("../rules/userAgentAnalysis");
const rateLimiting_1 = require("../rules/rateLimiting");
async function testBotProtection() {
    console.log('🧪 Starting Bot Protection System Tests...\n');
    try {
        // Test 1: Redis Connection
        console.log('1️⃣ Testing Redis Connection...');
        const testKey = 'test:connection';
        const redis = await redis_1.RedisService.getInstance();
        await redis.blockIP('127.0.0.1', { reason: 'Test connection', duration: 10 });
        const isConnected = await redis.isBlocked('127.0.0.1');
        console.log('✅ Redis Connection:', isConnected ? 'SUCCESS' : 'FAILED');
        console.log('---\n');
        // Test 2: Bot Detection
        console.log('2️⃣ Testing Bot Detection...');
        const testCases = [
            {
                name: 'Google Bot',
                ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                expected: true
            },
            {
                name: 'Headless Chrome',
                ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/91.0.4472.124 Safari/537.36',
                expected: true
            },
            {
                name: 'Normal Browser',
                ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                expected: false
            }
        ];
        for (const test of testCases) {
            const result = userAgentAnalysis_1.UserAgentAnalyzer.analyze(test.ua);
            console.log(`Test: ${test.name}`);
            console.log(`Expected: ${test.expected}, Got: ${result.isBot}`);
            console.log(`Reason: ${result.reason || 'None'}`);
        }
        console.log('---\n');
        // Test 3: Rate Limiting
        console.log('3️⃣ Testing Rate Limiting...');
        const testIP = '192.168.1.100';
        console.log('Testing API rate limit (100 requests per minute):');
        for (let i = 0; i < 5; i++) {
            const result = await rateLimiting_1.RateLimiter.check('API_CALLS', testIP);
            console.log(`Request ${i + 1}: ${result ? 'Allowed' : 'Blocked'}`);
        }
        console.log('---\n');
        // Test 4: Attack Logging
        console.log('4️⃣ Testing Attack Logging...');
        const attackData = {
            ip: '192.168.1.200',
            userAgent: 'Mozilla/5.0 (compatible; BadBot/1.0)',
            path: '/api/sensitive-data'
        };
        await redis.logAttack(attackData.ip, attackData.userAgent, attackData.path);
        console.log('✅ Attack logged successfully');
        console.log('---\n');
        // Test 5: IP Blocking
        console.log('5️⃣ Testing IP Blocking...');
        const blockIP = '192.168.1.300';
        await redis.blockIP(blockIP, {
            reason: 'Suspicious activity detected',
            duration: 300 // 5 minutes
        });
        const isBlocked = await redis.isBlocked(blockIP);
        const blockReason = await redis.getBlockReason(blockIP);
        console.log(`IP Blocked: ${isBlocked}`);
        console.log(`Block Reason: ${blockReason}`);
        console.log('---\n');
        console.log('🎉 All tests completed!');
    }
    catch (error) {
        console.error('❌ Test failed:', error);
    }
}
// Run tests
testBotProtection().catch(console.error);
