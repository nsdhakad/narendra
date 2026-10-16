(() => {
  const CACHE_URL = new URL("impact-factors.json", document.baseURI);
  const formatTitle = (record) => {
    const when = record.status === "live" && record.lastCheckedAt
      ? ` Last successfully fetched by the GitHub workflow: ${record.lastCheckedAt}.`
      : " This is the cached starter value; automatic checks begin after the GitHub Actions workflow runs.";
    const year = record.metricYear ? ` Reporting year: ${record.metricYear}.` : "";
    return `Impact Factor from ${record.publisher || "the publisher"}.${year}${when} Open the official journal metrics page for details.`;
  };

  fetch(CACHE_URL.href, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`Could not load Impact Factor cache (${response.status})`);
      return response.json();
    })
    .then((payload) => {
      const journals = payload && payload.journals ? payload.journals : {};
      document.querySelectorAll("[data-impact-factor]").forEach((element) => {
        const key = element.getAttribute("data-impact-factor");
        const record = journals[key];
        if (!record || record.value === undefined || record.value === null || String(record.value).trim() === "") return;
        element.textContent = String(record.value);
        element.title = formatTitle(record);
        const label = document.querySelector(`[data-impact-source="${key}"]`);
        if (label && record.url) {
          label.href = record.url;
          label.title = formatTitle(record);
          label.setAttribute("aria-label", `Impact Factor for ${record.name || key}; open official publisher metrics page`);
        }
      });
    })
    .catch((error) => {
      // Keep the server-rendered fallback values visible if the JSON cache is unavailable.
      console.warn("Impact Factor cache could not be refreshed in the page; using embedded values.", error);
    });
})();
