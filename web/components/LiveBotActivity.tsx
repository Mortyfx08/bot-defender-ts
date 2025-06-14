// src/components/LiveBotActivity.tsx
import React, { useEffect, useState } from "react";

type BotHit = {
  ip: string;
  country: string;
  timestamp: string;
  type: "real" | "suspicious";
};

// Creative country flag emoji generator
function getFlagEmoji(countryCode: string) {
  if (!countryCode || countryCode.length !== 2) return "🏳️";
  return countryCode
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export default function LiveBotActivity() {
  const [data, setData] = useState<BotHit[]>([]);
  const [filter, setFilter] = useState<"all" | "real" | "suspicious">("all");
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/bot-activity");
        const json = await res.json();
        if (
          Array.isArray(json) &&
          json.every(
            (item) =>
              typeof item === "object" &&
              typeof item.ip === "string" &&
              typeof item.country === "string" &&
              typeof item.timestamp === "string" &&
              (item.type === "real" || item.type === "suspicious")
          )
        ) {
          setData(json);
          setError(null);
        } else {
          setData([]);
          setError("Failed to load bot activity: Malformed data");
        }
      } catch (e) {
        setData([]);
        setError("Failed to load bot activity");
      } finally {
        setLoading(false);
      }
    };
    const fetchBlocked = async () => {
      try {
        const res = await fetch("/api/blocked-ips");
        const json = await res.json();
        if (
          json &&
          Array.isArray(json.data) &&
          json.data.every((ip: any) => ip && typeof ip.ip === "string")
        ) {
          setBlockedIPs(json.data.map((ip: any) => ip.ip));
        } else {
          setBlockedIPs([]);
        }
      } catch (e) {
        setBlockedIPs([]);
      }
    };

    setLoading(true);
    fetchData();
    fetchBlocked();
    const interval = setInterval(() => {
      fetchData();
      fetchBlocked();
    }, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const isBlocked = (ip: string) => blockedIPs.includes(ip);

  const filtered = Array.isArray(data)
    ? data.filter((item) => (filter === "all" ? true : item.type === filter))
    : [];

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "all" || value === "real" || value === "suspicious") {
      setFilter(value);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 border">
        <div className="text-gray-500">Loading live bot activity...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 border">
      {error && (
        <div className="text-red-600 font-semibold mb-2">{error}</div>
      )}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">Live Bot Activity</h2>
        <select
          value={filter}
          onChange={handleFilterChange}
          className="border px-2 py-1 rounded"
        >
          <option value="all">All</option>
          <option value="real">Real Bots</option>
          <option value="suspicious">Suspicious</option>
        </select>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="text-blue-800">IP</th>
            <th className="text-blue-800">Country</th>
            <th className="text-blue-800">Timestamp</th>
            <th className="text-blue-800">Type</th>
            <th className="text-blue-800">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((hit, index) => (
            <tr
              key={index}
              className="border-b animate-fade-in transition-all duration-500 ease-out hover:bg-blue-50"
              style={{ color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }}
            >
              <td style={{ color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }}>{hit.ip}</td>
              <td style={{ background: 'transparent' }}>
                <span style={{fontSize: "1.3em", marginRight: 4}}>{getFlagEmoji(hit.country)}</span>
                <span style={{ color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }}>{hit.country}</span>
              </td>
              <td style={{ color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }}>{new Date(hit.timestamp).toLocaleString()}</td>
              <td>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    hit.type === "suspicious"
                      ? "bg-yellow-100 border border-yellow-300"
                      : "bg-green-100 border border-green-300"
                  }`}
                  style={{ color: '#111827', background: 'rgba(17,24,39,0.07)', borderColor: '#111827', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }}
                >
                  {hit.type}
                </span>
              </td>
              <td>
                {blockedIPs.includes(hit.ip) ? (
                  <span style={{ color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }}>Blocked</span>
                ) : (
                  <span style={{ color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }}>Active</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
