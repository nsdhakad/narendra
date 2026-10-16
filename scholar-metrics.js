(() => {
  const nodes = document.querySelectorAll('[data-scholar-metric]');
  if (!nodes.length) return;
  const formatMetric = value => (Number.isFinite(Number(value)) && value !== null && value !== '' ? Number(value).toLocaleString() : '—');
  const status = document.querySelector('[data-scholar-status]');
  fetch('scholar-metrics.json?refresh=' + Date.now(), { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error('Metrics cache unavailable'); return response.json(); })
    .then(data => {
      nodes.forEach(node => { node.textContent = formatMetric(data.metrics?.[node.dataset.scholarMetric]); });
      if (!status) return;
      if (data.lastSuccessfulRefresh) {
        const date = new Date(data.lastSuccessfulRefresh + 'T00:00:00Z');
        status.textContent = 'Last successful Scholar metrics snapshot: ' + date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) + '. The updater checks weekly.';
      } else {
        status.textContent = 'Use “View Google Scholar” for the live profile.';
      }
    })
    .catch(() => { if (status) status.textContent = 'Google Scholar metrics could not be loaded. Visit the live profile for current counts.'; });
})();
