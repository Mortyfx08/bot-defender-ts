"use strict";
// detect.ts - TypeScript version of detect.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupBotDetection = void 0;
function setupBotDetection(formId, flagUrl = '/flag-suspicious') {
    window.addEventListener('load', () => {
        const start = performance.now();
        const form = document.getElementById(formId);
        if (!form)
            return;
        form.addEventListener('submit', (e) => {
            const end = performance.now();
            const timeSpent = end - start;
            if (timeSpent < 3000) {
                fetch(flagUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'Form submitted too fast (bot suspected)' })
                });
            }
        });
    });
}
exports.setupBotDetection = setupBotDetection;
