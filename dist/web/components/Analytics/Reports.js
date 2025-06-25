"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Reports;
const jsx_runtime_1 = require("react/jsx-runtime");
const polaris_1 = require("@shopify/polaris");
function Reports() {
    return ((0, jsx_runtime_1.jsxs)(polaris_1.Page, { title: "Analytics Reports", children: [(0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)("div", { style: { padding: '16px' }, children: (0, jsx_runtime_1.jsx)(polaris_1.TextContainer, { children: (0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h2", children: "Recent Security Events" }) }) }) }), (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)("div", { style: { padding: '16px' }, children: (0, jsx_runtime_1.jsx)(polaris_1.DataTable, { columnContentTypes: ['text', 'text', 'numeric'], headings: ['Date', 'Event', 'Count'], rows: [
                            ['2024-01-02', 'Bot Attack Blocked', '15'],
                            ['2024-01-01', 'Suspicious Activity', '8'],
                            ['2023-12-31', 'Rate Limit Exceeded', '23']
                        ] }) }) })] }));
}
