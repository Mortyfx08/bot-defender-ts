"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Blocklist;
const jsx_runtime_1 = require("react/jsx-runtime");
// Blocklist.tsx
const react_1 = require("react");
const polaris_1 = require("@shopify/polaris");
function Blocklist() {
    const [blockedIPs, setBlockedIPs] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const fetchBlockedIPs = async () => {
            try {
                const res = await fetch('/api/blocked-ips');
                const json = await res.json();
                if (json && Array.isArray(json.data)) {
                    setBlockedIPs(json.data.map((ip) => ip.ip));
                }
                else {
                    setBlockedIPs([]);
                }
            }
            catch (e) {
                setError('Failed to load blocked IPs');
                setBlockedIPs([]);
            }
            finally {
                setLoading(false);
            }
        };
        fetchBlockedIPs();
    }, []);
    if (loading) {
        return (0, jsx_runtime_1.jsx)("div", { children: "Loading blocked IPs..." });
    }
    if (error) {
        return (0, jsx_runtime_1.jsx)("div", { className: "text-red-600", children: error });
    }
    return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { title: "Blocked IPs", children: (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)("div", { style: { padding: '16px' }, children: (0, jsx_runtime_1.jsxs)(polaris_1.TextContainer, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h2", children: "Blocked IP Addresses" }), blockedIPs.length > 0 ? ((0, jsx_runtime_1.jsx)("ul", { children: blockedIPs.map((ip, index) => ((0, jsx_runtime_1.jsx)("li", { children: ip }, index))) })) : ((0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "No blocked IPs found." }))] }) }) }) }));
}
