Latest UI refinement package

- Reduced institutional, education, and sponsor logo boxes so they fit alongside text without stretching images.
- Footer social links are icon-only for LinkedIn, Facebook, X, and Instagram, using the provided profile URLs.
- Removed “Watch on YouTube” links from the VLSI Resources video cards while keeping embedded previews.
- Added a persistent light/dark mode toggle to the top navigation on all standard pages.

Replace matching files in the existing repository while preserving the directory structure.

## Follow-up visual fixes (October 2026)
- Intel wordmark updated to the matching classic Intel logo from Wikimedia Commons. The supplied PNG All URL is a download webpage, and PNG All asks users not to hotlink its raw PNG, so the site uses the equivalent publicly available SVG rather than the prohibited direct image URL.
- IGEC logo links now open the supplied Allegiance Educare college page. That URL is a webpage, not a direct image file, so the visible IGEC icon remains sourced from the college domain rather than attempting to load the page as an image.
- Removed CSS-created white logo backgrounds, borders, padding, and shadows; logos remain contained within their defined rectangular logo areas.
- Strengthened footer social icon sizing, contrast, and visibility in dark and light themes.
- Theme control now remembers manual choices across pages/tabs and follows the device's light/dark preference on the first visit when no saved choice exists.

### More to explore layout fix
- Restored the missing base CSS for the homepage's More to explore link grid, which had caused all link text to run together as plain underlined text.
- Rebuilt the links as separate responsive cards with labels, titles, summaries, and arrow affordances; three columns on wide screens, two on medium screens, and one on small phones.
- Matched the standalone interactive preview to the same card layout.
