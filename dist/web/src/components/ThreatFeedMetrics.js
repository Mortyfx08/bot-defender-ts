"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatFeedMetrics = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const polaris_1 = require("@shopify/polaris");
const ThreatFeedMetrics = ({ metrics, threatFeedData }) => {
    const formatDate = (dateString) => {
        if (!dateString)
            return 'Never';
        return new Date(dateString).toLocaleString();
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "threat-feed-metrics", children: (0, jsx_runtime_1.jsxs)(polaris_1.TextContainer, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingMd", as: "h2", children: "Threat Feed Metrics" }), (0, jsx_runtime_1.jsxs)("div", { className: "metrics-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: metrics.totalThreatFeedIPs }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Total Threat Feed IPs" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: metrics.threatFeedBlocks }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Threat Feed Blocks" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: formatDate(metrics.lastUpdate) }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Last Update" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metrics-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "metric-card severity-high", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: metrics.threatFeedHighSeverity }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "High Severity" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card severity-medium", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: metrics.threatFeedMediumSeverity }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Medium Severity" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card severity-low", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: metrics.threatFeedLowSeverity }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Low Severity" })] })] })] }) }));
};
exports.ThreatFeedMetrics = ThreatFeedMetrics;
