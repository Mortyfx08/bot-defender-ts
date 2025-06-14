// src/services/botActivityService.ts
export async function getBotActivity() {
  const res = await fetch("/api/bot-activity");
  if (!res.ok) throw new Error("Failed to fetch bot activity");
  return res.json();
}
