"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Configuration;
const jsx_runtime_1 = require("react/jsx-runtime");
const polaris_1 = require("@shopify/polaris");
function Configuration() {
    return ((0, jsx_runtime_1.jsx)(polaris_1.Page, { title: "Rule Configuration", children: (0, jsx_runtime_1.jsx)(polaris_1.Card, { children: (0, jsx_runtime_1.jsx)("div", { style: { padding: '16px' }, children: (0, jsx_runtime_1.jsx)(polaris_1.TextContainer, { children: (0, jsx_runtime_1.jsx)(polaris_1.Text, { variant: "headingLg", as: "h2", children: "Configure Bot Defense Rules" }) }) }) }) }));
}
