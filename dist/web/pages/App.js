"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const jsx_runtime_1 = require("react/jsx-runtime");
const polaris_1 = require("@shopify/polaris");
const app_bridge_react_1 = require("@shopify/app-bridge-react");
require("@shopify/polaris/build/esm/styles.css");
const Dashboard_1 = __importDefault(require("../components/Dashboard"));
// App Bridge config
const appBridgeConfig = {
    apiKey: process.env.REACT_APP_SHOPIFY_API_KEY || '',
    host: new URLSearchParams(window.location.search).get('host') || '',
    forceRedirect: true
};
function App() {
    return ((0, jsx_runtime_1.jsx)(app_bridge_react_1.Provider, { config: appBridgeConfig, children: (0, jsx_runtime_1.jsx)(polaris_1.AppProvider, { i18n: {}, children: (0, jsx_runtime_1.jsx)(polaris_1.Page, { title: "Bot Defender", subtitle: "Protect your store from malicious bots", children: (0, jsx_runtime_1.jsx)(Dashboard_1.default, {}) }) }) }));
}
