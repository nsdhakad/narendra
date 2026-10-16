# Update notes — October 2026

- Removed `projects.html` (the standalone Research Projects page) from the complete website bundle. Internal navigation and references now route to surviving pages; no internal links should point to `projects.html`.
- Rebuilt `chip-gallery.html` around the four entries from the public Chip Gallary source: SoC: IMC + RISC-V (TUM), FlexDCIM (NTU Singapore collaboration), QuadPort (IIT Indore), and D-IMC (Intel Labs). Each image opens its full-size public source asset.
- Expanded `professional-activities.html` to include all source categories and records: leadership/service, invited talks, peer-review venues, memberships, and courses/seminars/workshops/conferences.
- Reworked `gallery.html` into a photo-repository album index with the public original-photo archive linked from each album. Added `assets/gallery/README.md` for repository-hosted photos. The actual original photographs are not bundled locally; add photographs you own or may publish to `assets/gallery/`.
- Updated the home page and interactive preview to feature Chip Gallery and Photo Repository instead of the removed Projects page. Updated the bottom navigation labels.
- Added responsive styles for chip images, the professional activity record list, and the album index; light/dark styling is included.

## Important for an existing GitHub repository

When applying the update-only ZIP, overwrite the files at the repository root and **delete the existing `projects.html` file manually** (or remove it in your GitHub commit). The update-only ZIP cannot delete a file just by omitting it. The complete website ZIP already excludes `projects.html`.
