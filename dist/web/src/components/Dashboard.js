"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dashboard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const polaris_1 = require("@shopify/polaris");
const react_router_dom_1 = require("react-router-dom");
const ThreatFeedMetrics_1 = require("./ThreatFeedMetrics");
const ActivityLog_1 = require("./ActivityLog");
const LiveBotActivity_1 = require("./LiveBotActivity");
const StoreConfig_1 = require("./StoreConfig");
const Dashboard = () => {
    const [data, setData] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const [storeConfig, setStoreConfig] = (0, react_1.useState)({
        theme: 'system',
        notifications: true,
        autoBlock: true,
        blockThreshold: 5,
        dashboardLayout: 'detailed',
        primaryColor: '#008060',
        refreshInterval: 30,
        showMetrics: {
            totalAlerts: true,
            blockedIPs: true,
            botActivities: true,
            threatFeed: true,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: 'MM/DD/YYYY',
    });
    const navigate = (0, react_router_dom_1.useNavigate)();
    const location = (0, react_router_dom_1.useLocation)();
    (0, react_1.useEffect)(() => {
        const fetchDashboardData = async () => {
            try {
                // Get shop from URL parameters
                const urlParams = new URLSearchParams(location.search);
                const shop = urlParams.get('shop');
                if (!shop) {
                    // If no shop parameter, try to get it from the hostname
                    const hostname = window.location.hostname;
                    if (hostname.includes('.myshopify.com')) {
                        // If we're on a Shopify domain, use it
                        const shopDomain = hostname;
                        navigate(`/dashboard?shop=${shopDomain}`);
                        return;
                    }
                    else {
                        setError('No shop parameter found. Please access this page through your Shopify admin.');
                        setLoading(false);
                        return;
                    }
                }
                // Validate shop domain format
                if (!shop.endsWith('.myshopify.com')) {
                    setError('Invalid shop domain format. Must end with .myshopify.com');
                    setLoading(false);
                    return;
                }
                // Fetch dashboard data
                const dashboardResponse = await fetch(`/api/dashboard?shop=${shop}`);
                if (!dashboardResponse.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }
                const dashboardResult = await dashboardResponse.json();
                setData(dashboardResult.data);
                // Fetch store configuration
                const configResponse = await fetch(`/api/store-config?shop=${shop}`);
                if (configResponse.ok) {
                    const configResult = await configResponse.json();
                    setStoreConfig(configResult.data);
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
            finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, storeConfig.refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [location.search, storeConfig.refreshInterval, navigate]);
    const handleConfigUpdate = async (newConfig) => {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const shop = urlParams.get('shop');
            if (!shop) {
                throw new Error('No shop parameter found');
            }
            const response = await fetch('/api/store-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shop, config: newConfig }),
            });
            if (!response.ok) {
                throw new Error('Failed to update store configuration');
            }
            setStoreConfig(newConfig);
        }
        catch (error) {
            console.error('Error updating store configuration:', error);
        }
    };
    if (loading) {
        return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { children: (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Loading dashboard data..." }) }));
    }
    if (error) {
        return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { children: (0, jsx_runtime_1.jsxs)(polaris_1.Banner, { title: "Error", status: "critical", children: [(0, jsx_runtime_1.jsx)("p", { children: error }), (0, jsx_runtime_1.jsx)("p", { children: "Please ensure you're accessing this page through your Shopify admin panel." }), (0, jsx_runtime_1.jsx)("p", { children: "If you're testing locally, you can use: http://localhost:3000/dashboard?shop=your-store.myshopify.com" })] }) }));
    }
    if (!data) {
        return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { children: (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "No data available" }) }));
    }
    const formatDate = (date) => {
        if (!date)
            return 'Never';
        return new Date(date).toLocaleString(undefined, {
            timeZone: storeConfig.timezone,
        });
    };
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(StoreConfig_1.StoreConfig, { shop: data.shop, onConfigUpdate: handleConfigUpdate }), (0, jsx_runtime_1.jsx)(polaris_1.Page, { title: `Bot Defender - ${data.shop.name}`, subtitle: storeConfig.customGreeting, children: (0, jsx_runtime_1.jsx)(polaris_1.Layout, { children: (0, jsx_runtime_1.jsx)(polaris_1.Layout.Section, { children: (0, jsx_runtime_1.jsxs)("div", { className: `dashboard-grid ${storeConfig.dashboardLayout}`, style: { '--primary-color': storeConfig.primaryColor }, children: [(0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsxs)(polaris_1.TextContainer, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingMd", as: "h2", children: "Store Information" }), (0, jsx_runtime_1.jsxs)(polaris_1.Text, { as: "p", children: ["Domain: ", data.shop.domain] }), (0, jsx_runtime_1.jsxs)(polaris_1.Text, { as: "p", children: ["Name: ", data.shop.name] })] }) }), storeConfig.showMetrics.threatFeed && ((0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)(polaris_1.TextContainer, { children: (0, jsx_runtime_1.jsx)(ThreatFeedMetrics_1.ThreatFeedMetrics, { metrics: data.metrics.threatFeedMetrics, threatFeedData: data.threatFeedData }) }) })), (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsxs)(polaris_1.TextContainer, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingMd", as: "h2", children: "Security Metrics" }), (0, jsx_runtime_1.jsxs)("div", { className: "metrics-grid", children: [storeConfig.showMetrics.totalAlerts && ((0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.totalAlerts }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Total Alerts" })] })), storeConfig.showMetrics.blockedIPs && ((0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.totalBlockedIPs }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Blocked IPs" })] })), storeConfig.showMetrics.botActivities && ((0, jsx_runtime_1.jsxs)("div", { className: "metric-card", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h3", children: data.metrics.recentBotActivities }), (0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", children: "Recent Bot Activities" })] }))] })] }) }), storeConfig.showMetrics.botActivities && ((0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)(LiveBotActivity_1.LiveBotActivity, { shop: data.shop.domain }) })), (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)(ActivityLog_1.ActivityLog, { shop: data.shop.domain }) })] }) }) }) })] }));
};
exports.Dashboard = Dashboard;
