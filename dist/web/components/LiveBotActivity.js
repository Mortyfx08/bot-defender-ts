"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LiveBotActivity;
const jsx_runtime_1 = require("react/jsx-runtime");
// src/components/LiveBotActivity.tsx
const react_1 = require("react");
// Creative country flag emoji generator
function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2)
        return "🏳️";
    return countryCode
        .toUpperCase()
        .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}
function LiveBotActivity() {
    const [data, setData] = (0, react_1.useState)([]);
    const [filter, setFilter] = (0, react_1.useState)("all");
    const [blockedIPs, setBlockedIPs] = (0, react_1.useState)([]);
    const [error, setError] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const fetchData = async () => {
            try {
                const res = await fetch("/api/bot-activity");
                const json = await res.json();
                if (Array.isArray(json) &&
                    json.every((item) => typeof item === "object" &&
                        typeof item.ip === "string" &&
                        typeof item.country === "string" &&
                        typeof item.timestamp === "string" &&
                        (item.type === "real" || item.type === "suspicious"))) {
                    setData(json);
                    setError(null);
                }
                else {
                    setData([]);
                    setError("Failed to load bot activity: Malformed data");
                }
            }
            catch (e) {
                setData([]);
                setError("Failed to load bot activity");
            }
            finally {
                setLoading(false);
            }
        };
        const fetchBlocked = async () => {
            try {
                const res = await fetch("/api/blocked-ips");
                const json = await res.json();
                if (json &&
                    Array.isArray(json.data) &&
                    json.data.every((ip) => ip && typeof ip.ip === "string")) {
                    setBlockedIPs(json.data.map((ip) => ip.ip));
                }
                else {
                    setBlockedIPs([]);
                }
            }
            catch (e) {
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
    const isBlocked = (ip) => blockedIPs.includes(ip);
    const filtered = Array.isArray(data)
        ? data.filter((item) => (filter === "all" ? true : item.type === filter))
        : [];
    const handleFilterChange = (e) => {
        const value = e.target.value;
        if (value === "all" || value === "real" || value === "suspicious") {
            setFilter(value);
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-4 border", children: (0, jsx_runtime_1.jsx)("div", { className: "text-gray-500", children: "Loading live bot activity..." }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-4 border", children: [error && ((0, jsx_runtime_1.jsx)("div", { className: "text-red-600 font-semibold mb-2", children: error })), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-2", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-bold", children: "Live Bot Activity" }), (0, jsx_runtime_1.jsxs)("select", { value: filter, onChange: handleFilterChange, className: "border px-2 py-1 rounded", children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "All" }), (0, jsx_runtime_1.jsx)("option", { value: "real", children: "Real Bots" }), (0, jsx_runtime_1.jsx)("option", { value: "suspicious", children: "Suspicious" })] })] }), (0, jsx_runtime_1.jsxs)("table", { className: "w-full text-sm", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "text-left border-b", children: [(0, jsx_runtime_1.jsx)("th", { className: "text-blue-800", children: "IP" }), (0, jsx_runtime_1.jsx)("th", { className: "text-blue-800", children: "Country" }), (0, jsx_runtime_1.jsx)("th", { className: "text-blue-800", children: "Timestamp" }), (0, jsx_runtime_1.jsx)("th", { className: "text-blue-800", children: "Type" }), (0, jsx_runtime_1.jsx)("th", { className: "text-blue-800", children: "Status" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { children: filtered.map((hit, index) => ((0, jsx_runtime_1.jsxs)("tr", { className: "border-b animate-fade-in transition-all duration-500 ease-out hover:bg-blue-50", style: { color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }, children: [(0, jsx_runtime_1.jsx)("td", { style: { color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }, children: hit.ip }), (0, jsx_runtime_1.jsxs)("td", { style: { background: 'transparent' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontSize: "1.3em", marginRight: 4 }, children: getFlagEmoji(hit.country) }), (0, jsx_runtime_1.jsx)("span", { style: { color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }, children: hit.country })] }), (0, jsx_runtime_1.jsx)("td", { style: { color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }, children: new Date(hit.timestamp).toLocaleString() }), (0, jsx_runtime_1.jsx)("td", { children: (0, jsx_runtime_1.jsx)("span", { className: `text-xs px-2 py-1 rounded-full ${hit.type === "suspicious"
                                            ? "bg-yellow-100 border border-yellow-300"
                                            : "bg-green-100 border border-green-300"}`, style: { color: '#111827', background: 'rgba(17,24,39,0.07)', borderColor: '#111827', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }, children: hit.type }) }), (0, jsx_runtime_1.jsx)("td", { children: blockedIPs.includes(hit.ip) ? ((0, jsx_runtime_1.jsx)("span", { style: { color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }, children: "Blocked" })) : ((0, jsx_runtime_1.jsx)("span", { style: { color: '#111827', background: 'transparent', WebkitTextFillColor: '#111827', textShadow: 'none', fontWeight: 500 }, children: "Active" })) })] }, index))) })] })] }));
}
