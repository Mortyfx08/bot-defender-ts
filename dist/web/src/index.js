"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const client_1 = __importDefault(require("react-dom/client"));
const react_router_dom_1 = require("react-router-dom");
const polaris_1 = require("@shopify/polaris");
require("@shopify/polaris/build/esm/styles.css");
const App_1 = __importDefault(require("./App"));
const en_json_1 = __importDefault(require("@shopify/polaris/locales/en.json"));
const root = client_1.default.createRoot(document.getElementById('root'));
root.render((0, jsx_runtime_1.jsx)(react_1.default.StrictMode, { children: (0, jsx_runtime_1.jsx)(react_router_dom_1.BrowserRouter, { children: (0, jsx_runtime_1.jsx)(polaris_1.AppProvider, { i18n: en_json_1.default, children: (0, jsx_runtime_1.jsx)(App_1.default, {}) }) }) }));
