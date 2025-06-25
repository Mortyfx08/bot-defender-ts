"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Allowlist;
const jsx_runtime_1 = require("react/jsx-runtime");
const polaris_1 = require("@shopify/polaris");
function Allowlist() {
    // Placeholder data
    const rows = [
        ['203.0.113.5', 'Manual', '2024-05-20', (0, jsx_runtime_1.jsx)(polaris_1.Button, { size: "slim", children: "Remove" })],
        ['198.51.100.7', 'Admin', '2024-05-18', (0, jsx_runtime_1.jsx)(polaris_1.Button, { size: "slim", children: "Remove" })],
    ];
    return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { title: "Allowlisted IPs", children: (0, jsx_runtime_1.jsxs)(polaris_1.Card, { children: [(0, jsx_runtime_1.jsx)("div", { style: { padding: '16px' }, children: (0, jsx_runtime_1.jsx)(polaris_1.TextContainer, { children: (0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h2", children: "Allowlisted IP Addresses" }) }) }), (0, jsx_runtime_1.jsx)(polaris_1.DataTable, { columnContentTypes: ['text', 'text', 'text', 'text'], headings: ['IP Address', 'Added By', 'Added At', 'Actions'], rows: rows })] }) }));
}
