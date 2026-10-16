# Narendra Singh Dhakad — Interactive 3D Portfolio (multi-page GitHub Pages site)

This folder is designed to be committed into **the same Git repository** as the Interactive 3D Portfolio. `index.html` remains the landing page, and profile links that previously pointed to the old personal website now resolve to local HTML pages in this repo.

## Included pages

- `index.html` — main animated portfolio with interactive Three.js chip
- `about.html` — biography and interests
- `experience.html` — industry, research, and teaching experience
- `education.html` — degrees and thesis details
- `research.html` — research areas and internal navigation
- `sponsored-projects.html` — sponsored project records
- `publications.html` — journal papers, conference papers, poster, and preprints (full author names; titles and venue names link to the associated publisher/repository)
- `publication.html` — compatibility alias with the same updated publication content
- `collaborators.html` — institutions and research collaborators
- `professional-activities.html` — IEEE service, talks, review activities, memberships
- `awards.html` — awards and fellowships
- `resources.html` — useful external VLSI and research links
- `gallery.html` — photo-repository album index, with links to the original photo archive
- `chip-gallery.html` — four research chip/design images: SoC IMC + RISC-V, FlexDCIM, QuadPort, and D-IMC
- Academic and community activities are integrated into `professional-activities.html`
- `contact.html` — contact information

## Important: update the existing repository

1. Download and extract this ZIP.
2. Open the **existing GitHub repository** that currently contains the Interactive 3D Portfolio.
3. Upload/commit all files and page HTML files at the repository root (keep the existing `index.html`, `styles.css`, and `script.js`, replacing them with the updated versions from this bundle).
4. Do **not** create a second repository unless you separately want another copy.
5. Keep GitHub Pages configured for the existing repository's `main` branch and `/(root)` folder.
6. After the commit deploys, all local links such as `research.html` and `publications.html` will use the same GitHub Pages site and repository.

## Automated publisher Impact Factor updates

`publication.html` and `publications.html` display journal-level Impact Factors from `impact-factors.json`. The values are seeded from publisher information and the visible label **Impact Factor** links to the official journal metrics page. The browser reads the local JSON cache because most publishers prevent client-side cross-origin requests.

The workflow at `.github/workflows/update-impact-factors.yml` runs monthly and can also be launched manually from **GitHub → Actions → Refresh publisher Impact Factors → Run workflow**. It fetches official journal/publisher pages, updates the cache only when it can recognize a plausible metric, and preserves the last cached value if a publisher is unavailable or its page structure changes. Publisher page markup is not standardized, so review the Actions log if a journal remains marked as cached. GitHub Actions must be allowed to write repository contents for automatic commits; check **Settings → Actions → General → Workflow permissions** and enable read/write access if commits are denied.

This is a best-effort automated refresh—not an API-backed guarantee. Impact Factors are publisher journal-level metrics, may be reported for different metric years, and do not describe an individual paper. When a publisher changes the metric display format, update its parser pattern in `scripts/update_impact_factors.py`.

## Preview locally

On Windows, double-click `start-preview.bat` from the extracted project folder. Or run this in the folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The 3D chip uses Three.js from a CDN and web fonts use Google Fonts, so an internet connection is needed for the full 3D presentation. The home page includes a CSS fallback if WebGL is unavailable.

## Content accuracy

The page copy is based on content in the public biography, experience, education, research, publications, professional activities, awards, resources, chip gallery, and photo repository pages. Please proofread details before publishing. Publisher and learning-resource URLs are external links where appropriate; internal portfolio links all stay within this repository.

## Main public profile sources

- Biography: https://www.narendradhakad.com/
- Experience: https://www.narendradhakad.com/experience
- Education: https://www.narendradhakad.com/education
- Research: https://www.narendradhakad.com/research
- Publications: https://www.narendradhakad.com/research/publications
- Professional activities: https://www.narendradhakad.com/professional-activities


## Latest profile updates

- Current role wording is **EDA Tools Hardware Engineer** throughout the portfolio.
- The About page contains the expanded biography, teaching appointments, IEEE chapter leadership, and reviewer service.
- Journey and Experience rows and Education entries include enlarged, proportionally contained institution/company logos with fallback text when an external logo host fails.
  Logo images are loaded from publicly accessible institution/company and logo-host URLs (rather than bundled local image files), so those image hosts must remain accessible for the graphics to appear.
- The VLSI Resources page includes embedded YouTube previews and the full set of learning/research links from the original resources page. The standalone Research Projects page has been removed; the Chip Gallery now contains the four visual entries from the original chip gallery.
- Sponsored projects list role, host institute, PI/supervisor, funding agency, and amount as separate fields, with sponsor logos and a continuously scrolling funding/research logo strip.
- The WhatsApp conversation buttons use the supplied number +91 8989458975.

Social links currently include the verified LinkedIn profile. Footer social links use the profile URLs configured in the site pages; verify each destination before publishing any account changes.


## Latest UI refinements
- Institutional, employer, education, and sponsor logos are enlarged to approximately three times their compact legacy dimensions; images remain proportional, transparent, and border-free, with responsive sizing on tablets and phones.
- Footer social icons link to LinkedIn, Facebook, X, and Instagram.
- VLSI Resources embeds videos without the extra “Watch on YouTube” lines.
- A light/dark theme toggle appears in the top header on each standard page and remembers the preference across pages.


#### Chip gallery images
The Chip Gallery uses four locally stored, lossless WebP images in `assets/chip-gallery/`, ordered as SoC: IMC + RISC-V, FlexDCIM, QuadPort, and D-IMC. Keep this folder in place when deploying the site.


## Google Scholar metrics

`publications.html` displays citation count, h-index, and i10-index from `scholar-metrics.json`. The `.github/workflows/update-scholar-metrics.yml` workflow checks the public Scholar profile every Monday and commits a refreshed timestamp and metric values whenever a successful refresh completes. Google Scholar may rate-limit or challenge automated requests; on a blocked fetch the script preserves existing values rather than inventing numbers. Use the workflow's manual dispatch option to request an immediate refresh.

## Latest refinements
See `UPDATE-NOTES.md` for the latest Education abstracts, About portrait link, Intel logo source, Impact Factor label styling, and footer academic-profile icons. If the Drive portrait does not load, ensure the image link is public; the site includes a local fallback portrait.
