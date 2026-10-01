# DAEKON concept prototypes (disposable — not production code)

Each finalist concept from the tournament gets its own self-contained folder here
(e.g. `prototypes/a-editorial/`, `prototypes/b-spatial/`), built as plain static
HTML/CSS/JS (no build step) so it can be rendered and screenshotted immediately.

Serve any prototype folder locally with:

    npx serve prototypes/<folder-name>

This directory is isolated from the real production app per DAEKON's
prototype-before-production rule (`daekon-creative-engineering.md`). Nothing here
ships — once a winner is picked, the production app is built fresh under the
project root using the winning concept as its visual/interaction reference, and
this directory (or the losing prototype) gets cleaned up.
