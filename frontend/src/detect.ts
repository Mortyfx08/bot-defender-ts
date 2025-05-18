// detect.ts - TypeScript version of detect.js

export function setupBotDetection(formId: string, flagUrl: string = '/flag-suspicious') {
  window.addEventListener('load', () => {
    const start = performance.now();
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
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
