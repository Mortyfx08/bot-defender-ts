"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Dashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const polaris_1 = require("@shopify/polaris");
const ThreatFeedMetrics_1 = require("./ThreatFeedMetrics");
require("./DashboardPage.css");
function Dashboard() {
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [refreshing, setRefreshing] = (0, react_1.useState)(false);
    const [data, setData] = (0, react_1.useState)(null);
    const [error, setError] = (0, react_1.useState)(null);
    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/dashboard');
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
            const result = await response.json();
            setData(result.data);
            setError(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    (0, react_1.useEffect)(() => {
        fetchDashboardData();
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);
    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "loading-container", children: (0, jsx_runtime_1.jsx)(polaris_1.Spinner, { size: "large" }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { title: "Bot Defender", children: (0, jsx_runtime_1.jsx)(polaris_1.Banner, { status: "critical", children: (0, jsx_runtime_1.jsxs)("p", { children: ["Error loading dashboard: ", error] }) }) }));
    }
    if (!data) {
        return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { title: "Bot Defender", children: (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsxs)(polaris_1.TextContainer, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingMd", as: "h2", children: "No Data Available" }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "There is no bot activity data available for your store yet." })] }) }) }));
    }
    // Extract store name from shop domain (e.g., mystore.myshopify.com => mystore)
    const shopDomain = data.shop || '';
    const storeName = shopDomain ? shopDomain.split('.')[0] : '';
    return ((0, jsx_runtime_1.jsxs)(polaris_1.Page, { title: "Bot Defender", children: [(0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsxs)(polaris_1.Text, { variant: "headingLg", as: "h1", children: ["Welcome", storeName ? `, ${storeName}` : '', "!"] }) }), (0, jsx_runtime_1.jsx)(polaris_1.Layout, { children: (0, jsx_runtime_1.jsx)(polaris_1.Layout.Section, { children: (0, jsx_runtime_1.jsxs)("div", { className: "dashboard-grid", children: [(0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)(polaris_1.TextContainer, { children: (0, jsx_runtime_1.jsx)(ThreatFeedMetrics_1.ThreatFeedMetrics, { metrics: data.metrics.threatFeedMetrics, threatFeedData: data.threatFeedData }) }) }), (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsxs)(polaris_1.TextContainer, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingMd", as: "h2", children: "Security Metrics" }), (0, jsx_runtime_1.jsxs)("div", { className: "metrics-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.totalAlerts }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Total Alerts" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.totalBlockedIPs }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Blocked IPs" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.recentBotActivities }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Recent Bot Activities" })] })] })] }) }), (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsxs)(polaris_1.TextContainer, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingMd", as: "h2", children: "Alert Severity" }), (0, jsx_runtime_1.jsxs)("div", { className: "metrics-grid", children: [(0, jsx_runtime_1.jsxs)("div", { className: "metric-card severity-high", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.highSeverityAlerts }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "High Severity" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card severity-medium", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.mediumSeverityAlerts }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Medium Severity" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "metric-card severity-low", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.lowSeverityAlerts }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Low Severity" })] })] })] }) })] }) }) })] }));
}
