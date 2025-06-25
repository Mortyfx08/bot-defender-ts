"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const polaris_1 = require("@shopify/polaris");
const ActivityLog = ({ shop }) => {
    const [activities, setActivities] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const fetchActivities = async () => {
            try {
                const response = await fetch(`/api/activity-log?shop=${shop}`);
                const data = await response.json();
                setActivities(data);
            }
            catch (error) {
                console.error('Error fetching activity log:', error);
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
    return ((0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsxs)("div", { className: "p-4", children: [(0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingMd", as: "h2", children: "Activity Log" }), (0, jsx_runtime_1.jsx)(polaris_1.DataTable, { columnContentTypes: ['text', 'text', 'text', 'text'], headings: ['Type', 'Severity', 'Time', 'Details'], rows: activities.map(activity => [
                        activity.type,
                        getSeverityBadge(activity.severity),
                        new Date(activity.timestamp).toLocaleString(),
                        activity.details
                    ]) })] }) }));
};
exports.ActivityLog = ActivityLog;
