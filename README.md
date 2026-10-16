# Narendra Singh Dhakad — Interactive 3D Portfolio 

This folder is designed to be committed into **the same Git repository** as the Interactive 3D Portfolio. `index.html` remains the landing page, and profile links that previously pointed to the old personal website now resolve to local HTML pages in this repo.

## Included pages

- `index.html` — main animated portfolio with interactive Three.js chip
- `about.html` — biography and interests
- `experience.html` — industry, research, and teaching experience
- `education.html` — degrees and thesis details
- `research.html` — research areas and internal navigation
- `projects.html` — selected research projects
- `sponsored-projects.html` — sponsored project records
- `publications.html` — journal papers, conference papers, poster, and preprints (full author names; titles and venue names link to the associated publisher/repository)
- `publication.html` — compatibility alias with the same updated publication content
- `collaborators.html` — institutions and research collaborators
- `professional-activities.html` — IEEE service, talks, review activities, memberships
- `awards.html` — awards and fellowships
- `resources.html` — useful external VLSI and research links
- `gallery.html` — text index of selected academic/community moments; add owned photos when available
- `chip-gallery.html` — conceptual index of architecture themes
- `extra-curricular.html` — academic service and outreach
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

The page copy is based on content in the public biography, experience, education, research, projects, publications, professional activities, awards, resources, and gallery pages. Please proofread details before publishing. Publisher and learning-resource URLs are external links where appropriate; internal portfolio links all stay within this repository.

## Main public profile sources

- Biography: https://www.narendradhakad.com/
- Experience: https://www.narendradhakad.com/experience
- Education: https://www.narendradhakad.com/education
- Research: https://www.narendradhakad.com/research
- Projects: https://www.narendradhakad.com/research/projects
- Publications: https://www.narendradhakad.com/research/publications
- Professional activities: https://www.narendradhakad.com/professional-activities
