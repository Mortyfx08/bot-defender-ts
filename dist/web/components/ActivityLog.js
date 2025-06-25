"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ActivityLog;
const jsx_runtime_1 = require("react/jsx-runtime");
// ActivityLog.tsx
const react_1 = require("react");
const polaris_1 = require("@shopify/polaris");
function ActivityLog() {
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [error, setError] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        fetchLogs();
    }, []);
    const fetchLogs = async () => {
        try {
            const response = await fetch('/api/logs');
            if (!response.ok) {
                throw new Error('Failed to fetch logs');
            }
            const data = await response.json();
            setLogs(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch logs');
        }
    };
    const handleBlockIP = async (ip) => {
        try {
            const res = await fetch('/api/block-ip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ip }),
            });
            if (!res.ok)
                throw new Error('Failed to block IP');
            // Refresh log after blocking
            const updated = await res.json();
            setLogs(prev => [...prev, updated.data]);
        }
        catch (err) {
            setError('Failed to block IP');
        }
    };
    const rows = logs.map(log => [
        log.timestamp,
        log.ip,
        log.action,
        log.details,
    ]);
    return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { title: "Activity Log", children: (0, jsx_runtime_1.jsxs)(polaris_1.Layout, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Layout.Section, { children: (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)("div", { style: { padding: '16px' }, children: (0, jsx_runtime_1.jsxs)(polaris_1.TextContainer, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h2", children: "Blocked IP Activity" }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "View and manage blocked IP addresses and their activity." })] }) }) }) }), (0, jsx_runtime_1.jsx)(polaris_1.Layout.Section, { children: (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)(polaris_1.DataTable, { columnContentTypes: ['text', 'text', 'text', 'text'], headings: ['Timestamp', 'IP Address', 'Action', 'Details'], rows: rows }) }) })] }) }));
}
