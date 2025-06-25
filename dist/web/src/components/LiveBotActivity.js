"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveBotActivity = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const polaris_1 = require("@shopify/polaris");
const LiveBotActivity = ({ shop }) => {
    const [activities, setActivities] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchActivities = async () => {
            try {
                const response = await fetch(`/api/bot-activities?shop=${shop}`);
                const data = await response.json();
                setActivities(data);
            }
            catch (error) {
                console.error('Error fetching bot activities:', error);
            }
        };
        fetchActivities();
        const interval = setInterval(fetchActivities, 15000); // Refresh every 15 seconds
        return () => clearInterval(interval);
    }, [shop]);
    const getSeverityBadge = (severity) => {
        const severityColors = {
            high: 'critical',
            medium: 'warning',
            low: 'info'
        };
        return (0, jsx_runtime_1.jsx)(polaris_1.Badge, { status: severityColors[severity] || 'info', children: severity });
    };
    return ((0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsxs)("div", { className: "p-4", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingMd", as: "h2", children: "Live Bot Activity" }), (0, jsx_runtime_1.jsx)(polaris_1.DataTable, { columnContentTypes: ['text', 'text', 'text', 'text', 'text'], headings: ['IP', 'User Agent', 'Path', 'Severity', 'Time'], rows: activities.map(activity => [
                        activity.ip,
                        activity.userAgent,
                        activity.path,
                        getSeverityBadge(activity.severity),
                        new Date(activity.timestamp).toLocaleString()
                    ]) })] }) }));
};
exports.LiveBotActivity = LiveBotActivity;
