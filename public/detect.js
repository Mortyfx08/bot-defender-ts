window.onload = () => {
    const start = performance.now();
  
    document.getElementById('checkout-form').addEventListener('submit', function(e) {
      const end = performance.now();
      const timeSpent = end - start;
  
      if (timeSpent < 3000) {
        fetch('/flag-suspicious', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Form submitted too fast (bot suspected)' })
        });
      }
    });
  };
  