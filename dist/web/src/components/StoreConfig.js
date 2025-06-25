"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreConfig = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const polaris_1 = require("@shopify/polaris");
const StoreConfig = ({ shop, onConfigUpdate }) => {
    const [isConfigModalOpen, setIsConfigModalOpen] = (0, react_1.useState)(false);
    const [activeTab, setActiveTab] = (0, react_1.useState)(0);
    const [config, setConfig] = (0, react_1.useState)({
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
    const handleConfigChange = (key, value) => {
        const newConfig = { ...config, [key]: value };
        setConfig(newConfig);
        onConfigUpdate(newConfig);
    };
    const handleMetricsChange = (metric, value) => {
        const newMetrics = { ...config.showMetrics, [metric]: value };
        handleConfigChange('showMetrics', newMetrics);
    };
    const userMenuMarkup = ((0, jsx_runtime_1.jsx)(polaris_1.ActionList, { items: [
            {
                content: 'Store Settings',
                onAction: () => setIsConfigModalOpen(true),
            },
            {
                content: 'View Store',
                url: `https://${shop.domain}`,
                external: true,
            },
        ] }));
    const tabs = [
        {
            id: 'general',
            content: 'General',
            accessibilityLabel: 'General settings',
            panelID: 'general-settings',
        },
        {
            id: 'appearance',
            content: 'Appearance',
            accessibilityLabel: 'Appearance settings',
            panelID: 'appearance-settings',
        },
        {
            id: 'metrics',
            content: 'Metrics',
            accessibilityLabel: 'Metrics settings',
            panelID: 'metrics-settings',
        },
    ];
    const timeZones = [
        'UTC',
        'Europe/Paris',
        'America/New_York',
        'Asia/Tokyo',
        // ...add as needed
    ];
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(polaris_1.TopBar, { userMenu: userMenuMarkup, showNavigationToggle: true }), (0, jsx_runtime_1.jsx)(polaris_1.Modal, { open: isConfigModalOpen, onClose: () => setIsConfigModalOpen(false), title: "Store Configuration", primaryAction: {
                    content: 'Save',
                    onAction: () => setIsConfigModalOpen(false),
                }, secondaryActions: [
                    {
                        content: 'Cancel',
                        onAction: () => setIsConfigModalOpen(false),
                    },
                ], children: (0, jsx_runtime_1.jsxs)(polaris_1.Modal.Section, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Tabs, { tabs: tabs, selected: activeTab, onSelect: setActiveTab, children: (0, jsx_runtime_1.jsxs)("div", { className: "config-tabs-content", children: [activeTab === 0 && ((0, jsx_runtime_1.jsxs)(polaris_1.FormLayout, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Select, { label: "Theme", options: [
                                                    { label: 'System Default', value: 'system' },
                                                    { label: 'Light', value: 'light' },
                                                    { label: 'Dark', value: 'dark' },
                                                ], value: config.theme, onChange: (value) => handleConfigChange('theme', value) }), (0, jsx_runtime_1.jsx)(polaris_1.TextField, { label: "Custom Domain", value: config.customDomain || '', onChange: (value) => handleConfigChange('customDomain', value), placeholder: "e.g., shop.yourdomain.com", autoComplete: "off" }), (0, jsx_runtime_1.jsx)(polaris_1.Select, { label: "Auto-Block Threshold", options: [
                                                    { label: '3 Attempts', value: '3' },
                                                    { label: '5 Attempts', value: '5' },
                                                    { label: '10 Attempts', value: '10' },
                                                ], value: String(config.blockThreshold), onChange: (value) => handleConfigChange('blockThreshold', Number(value)) }), (0, jsx_runtime_1.jsx)(polaris_1.TextField, { label: "Custom Greeting", value: config.customGreeting || '', onChange: (value) => handleConfigChange('customGreeting', value), placeholder: "Welcome to your dashboard!", autoComplete: "off" }), (0, jsx_runtime_1.jsx)(polaris_1.Select, { label: "Timezone", options: timeZones.map((tz) => ({
                                                    label: tz,
                                                    value: tz,
                                                })), value: config.timezone, onChange: (value) => handleConfigChange('timezone', value) }), (0, jsx_runtime_1.jsx)(polaris_1.Select, { label: "Date Format", options: [
                                                    { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                                                    { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                                                    { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
                                                ], value: config.dateFormat, onChange: (value) => handleConfigChange('dateFormat', value) })] })), activeTab === 1 && ((0, jsx_runtime_1.jsxs)(polaris_1.FormLayout, { children: [(0, jsx_runtime_1.jsx)(polaris_1.Select, { label: "Dashboard Layout", options: [
                                                    { label: 'Compact', value: 'compact' },
                                                    { label: 'Detailed', value: 'detailed' },
                                                    { label: 'Custom', value: 'custom' },
                                                ], value: config.dashboardLayout, onChange: (value) => handleConfigChange('dashboardLayout', value) }), (0, jsx_runtime_1.jsxs)("div", { className: "color-picker-wrapper", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { as: "p", variant: "bodyMd", children: "Primary Color" }), (0, jsx_runtime_1.jsx)("input", { type: "color", value: config.primaryColor, onChange: (e) => handleConfigChange('primaryColor', e.target.value) })] }), (0, jsx_runtime_1.jsx)(polaris_1.RangeSlider, { label: "Refresh Interval (seconds)", value: config.refreshInterval, min: 10, max: 60, step: 5, onChange: (value) => handleConfigChange('refreshInterval', value), output: true })] })), activeTab === 2 && ((0, jsx_runtime_1.jsxs)(polaris_1.FormLayout, { children: [(0, jsx_runtime_1.jsx)(polaris_1.SettingToggle, { action: {
                                                    content: config.showMetrics.totalAlerts ? 'Hide' : 'Show',
                                                    onAction: () => handleMetricsChange('totalAlerts', !config.showMetrics.totalAlerts),
                                                }, enabled: config.showMetrics.totalAlerts, children: "Show Total Alerts" }), (0, jsx_runtime_1.jsx)(polaris_1.SettingToggle, { action: {
                                                    content: config.showMetrics.blockedIPs ? 'Hide' : 'Show',
                                                    onAction: () => handleMetricsChange('blockedIPs', !config.showMetrics.blockedIPs),
                                                }, enabled: config.showMetrics.blockedIPs, children: "Show Blocked IPs" }), (0, jsx_runtime_1.jsx)(polaris_1.SettingToggle, { action: {
                                                    content: config.showMetrics.botActivities ? 'Hide' : 'Show',
                                                    onAction: () => handleMetricsChange('botActivities', !config.showMetrics.botActivities),
                                                }, enabled: config.showMetrics.botActivities, children: "Show Bot Activities" }), (0, jsx_runtime_1.jsx)(polaris_1.SettingToggle, { action: {
                                                    content: config.showMetrics.threatFeed ? 'Hide' : 'Show',
                                                    onAction: () => handleMetricsChange('threatFeed', !config.showMetrics.threatFeed),
                                                }, enabled: config.showMetrics.threatFeed, children: "Show Threat Feed" })] }))] }) }), (0, jsx_runtime_1.jsxs)(polaris_1.Banner, { title: "Store Information", status: "info", children: [(0, jsx_runtime_1.jsxs)("p", { children: ["Store Name: ", shop.name] }), (0, jsx_runtime_1.jsxs)("p", { children: ["Domain: ", shop.domain] })] })] }) })] }));
};
exports.StoreConfig = StoreConfig;
