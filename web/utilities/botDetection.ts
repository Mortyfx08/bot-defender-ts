export const GET_APP_DATA = `query GetAppData { rules { id name } }`;

export function detectBot(userAgent: string): boolean {
  const bots = [
    'Googlebot', 'Bingbot', 'Slurp', 
    'DuckDuckBot', 'YandexBot', 'Sogou'
  ];
  return bots.some(bot => userAgent.includes(bot));
}
