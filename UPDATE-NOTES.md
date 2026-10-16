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


## Latest refinements (October 2026)
- Education page: Ph.D., M.Tech., and B.E. abstracts updated to the user-provided wording; thesis/project and supervisor rows have explicit block styling.
- About page: the provided Google Drive portrait URL is the primary image source, with the existing bundled portrait as a local fallback if Drive is inaccessible.
- Intel logo imagery now uses the direct PNG asset from the requested Seeklogo Intel listing.
- Publication "Impact Factor" labels inherit ordinary detail text color and no longer carry accent/link styling.
- CV, Google Scholar, ResearchGate, and ORCID icon links have been moved from the homepage profile-card block into the footer icon row across pages.

Note: The Google Drive image could not be downloaded in this environment to bundle locally. The About page points to the Drive image directly and falls back to the existing local portrait if it does not load. Ensure the Drive file is shared as "Anyone with the link" for the direct image to display to site visitors.


## 2026-10-16 Contact, abstracts, photo, and Intel logo fix

- Styled Contact page methods as separate responsive cards with clear title, subtitle, and arrow placement.
- Increased the Education Abstract popover width to up to 680px on desktop with responsive viewport-safe sizing.
- Updated the About portrait to use the publicly shared Google Drive thumbnail endpoint and retain `assets/narendra-portrait.png` as fallback.
- Switched Intel logos to PNGAll's direct image asset (`Intel-Logo-PNG-Image.webp`) instead of using the download landing page as an image URL; added a local SVG fallback to keep the logo visible if the external host blocks hotlinking. The image still links to Intel's official site.

Note: the Google Drive photo must be shared as “Anyone with the link” for external embeds to work.
