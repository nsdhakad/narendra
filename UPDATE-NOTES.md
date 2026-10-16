# Portfolio update notes

- Enlarged the employer, institution, education, and sponsor logos to approximately three times the earlier compact size, keeping transparent backgrounds, no CSS borders, and responsive sizing.
- Added the supplied portrait to `assets/narendra-portrait.png` and displayed it on the About page.
- Expanded About-page research interests to include all seven topics from the supplied image.
- Education now has three qualifications only; the duplicate Institutions section is removed. Education logos are substantially larger with no white box/border. Thesis/project titles and supervisor names use separate lines; thesis titles are italicized. Hover/focus or tap each Abstract button to open its panel. The PhD abstract is summarized from the IIT Indore repository record; the M.Tech and B.E. panels are clearly marked concise summaries because the linked source text did not provide full abstracts.
- Added CV, Google Scholar, ResearchGate, and ORCID cards to the homepage.
- Added citations, h-index, and i10-index cards to the publications page. `scholar-metrics.json` is the data cache; the new weekly GitHub Actions workflow refreshes values and the successful-refresh date when Google Scholar permits retrieval. Google Scholar currently rate-limits automated access, so initial values are deliberately shown as em dashes until a successful run; no metrics are fabricated.
- Removed the hyperlink from the words “Impact Factor” (the numeric journal metrics remain displayed). Added a “See Poster” button linked to the provided Google Drive poster and removed the hyperlink from the EDTM 2024 Student Research Forum venue text.
- Consolidated extra-curricular/community information into `professional-activities.html` and removed `extra-curricular.html`.
- Removed the standalone research projects page `projects.html` as previously requested.

## GitHub Actions note

After the package is committed to GitHub, open Actions and run “Refresh Google Scholar metrics” using `workflow_dispatch` to attempt an immediate refresh. Weekly runs occur on Mondays at 07:17 UTC. The workflow requires Actions to be enabled and the repository's `GITHUB_TOKEN` to be allowed to write contents. Google Scholar may block unattended readers; the job keeps the last known values in that case.
