# Contributing to jellyfindex

jellyfindex is a community-maintained directory of Jellyfin clients, plugins, and themes. Every entry is a small folder of files in this repo. There's no admin panel or database. Adding something new means adding a folder and opening a pull request.

This guide walks through adding a new entry from scratch. If you're updating an existing entry, the same file layout applies. Just edit the relevant files instead of creating new ones.

## Table of contents

- [1. Pick the right collection](#1-pick-the-right-collection)
- [2. Set up the repo](#2-set-up-the-repo)
- [3. Create the entry folder](#3-create-the-entry-folder)
    - [index.md](#indexmd)
    - [meta.yaml](#metayaml)
- [4. Fill in meta.yaml](#4-fill-in-metayaml)
    - [Fields shared by every collection](#fields-shared-by-every-collection)
    - [Links](#links)
    - [Images](#images)
- [5. Collection-specific fields](#5-collection-specific-fields)
    - [Clients](#clients-contentclientsslug)
    - [Plugins](#plugins-contentpluginsslug)
    - [Themes](#themes-contentthemesslug)
- [6. Validate](#6-validate)
- [7. Open a pull request](#7-open-a-pull-request)

## 1. Pick the right collection

| Collection | Path               | What it's for                                                      |
| ---------- | ------------------ | ------------------------------------------------------------------ |
| Clients    | `content/clients/` | Apps that play/browse a Jellyfin server (mobile, desktop, TV, ...) |
| Plugins    | `content/plugins/` | Server-side Jellyfin plugins                                       |
| Themes     | `content/themes/`  | CSS/visual themes for the Jellyfin web client                      |

Each entry is one directory, named with a lowercase, kebab-case slug that becomes part of the entry's URL (e.g. `content/clients/jellysee/` → `/clients/jellysee`). Use the project's own name, lowercased and hyphenated.

## 2. Set up the repo

```bash
pnpm install
```

```bash
pnpm run dev
```

The dev server picks up new content live, so you can preview your entry as you fill it in.

## 3. Create the entry folder

Every entry needs at least:

```
content/<clients|plugins|themes>/<your-slug>/
├── meta.yaml       # structured metadata (required)
├── index.md        # long-form description, plain markdown (required)
├── logo.webp       # square-ish logo (required for clients/plugins; not used for themes)
└── preview-images/ # screenshots (required for themes, optional but recommended otherwise)
```

The easiest way to start is to copy an existing entry of the same type as a template, e.g. [content/clients/jellysee](content/clients/jellysee), [content/plugins/pelagica-jellyfin-plugin](content/plugins/pelagica-jellyfin-plugin), or [content/themes/catppuccin](content/themes/catppuccin), then edit it.

### index.md

Just markdown, no frontmatter. A couple of paragraphs describing what the project does and why it's useful. This becomes the entry's main description on its detail page.

### meta.yaml

Structured metadata, described field-by-field below.

If you use VS Code, the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) is recommended and you will get autocomplete and validation against the schema automatically. Otherwise, run `pnpm run validate` to check your YAML.

## 4. Fill in meta.yaml

### Fields shared by every collection

| Field              | Type                                                 | Notes                                                                                     |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `name`             | string                                               | Display name                                                                              |
| `developerName`    | string                                               | Person or org behind it                                                                   |
| `developerGithub`  | string (optional)                                    | GitHub username/org, used to link the developer                                           |
| `dateAdded`        | date (`YYYY-MM-DD`)                                  | Set this to today's date. **Immutable** once merged. Don't change it in a later PR.       |
| `dateCreated`      | date (`YYYY-MM-DD`, optional)                        | When the project itself was first created/released                                        |
| `submittedBy`      | string                                               | Your GitHub username. **Immutable** once merged.                                          |
| `openSource`       | boolean                                              | If `true`, one of your `links` must point to the source (see [Links](#links) below)       |
| `license`          | `{ name, url? }` (optional)                          | e.g. `{ name: MIT, url: https://... }`                                                    |
| `shortDescription` | string, max 250 chars                                | One-liner shown on cards and in listings                                                  |
| `links`            | array of [link objects](#links)                      | GitHub, website, stores, donation, etc.                                                   |
| `installationLink` | [link object](#links) (optional)                     | A single "primary" install/download link, shown prominently                               |
| `aiUsage`          | `unknown` \| `none` \| `ai-assisted` \| `vibe-coded` | How AI was used in building the project. Defaults to `unknown`. Please set this honestly. |
| `aiDescription`    | string (optional)                                    | Free-text elaboration on `aiUsage`                                                        |
| `previewImages`    | array of image entries                               | See [Images](#images) below                                                               |
| `beta`             | boolean (optional)                                   | If `true`, the project is in beta and may be unstable                                     |

Don't set `official`, `abandoned`, or `ignoreAbandonedCheck` when submitting. They default to `false` and are generally managed by maintainers after review.

### Links

```yaml
links:
    - type: github
      url: https://github.com/you/your-project
    - type: website
      url: https://your-project.dev
```

`type` is one of: `github`, `gitlab`, `bitbucket`, `sourcehut`, `codeberg`, `website`, `documentation`, `translations`, `donation`, `app-store`, `google-play`, `f-droid`, `obtainium`, `discord`, `other`.

Repository host types (`github`, `gitlab`, `bitbucket`, `sourcehut`, `codeberg`) count as the "source link" automatically. For anything else, add `sourcelink: true` to mark it explicitly. If `openSource: true`, at least one link must resolve to a source link. Validation will fail otherwise.

You can also add `label: "Custom text"` to override a link's default button text.

### Images

- Logos: raster (`.webp`) or `.svg`.
- Preview images: `.webp` only.
- Max dimensions: 1920×1920px. Max file size: 500KB for `.webp`, 100KB for `.svg`.

Drop in whatever image files you have (PNG/JPG are fine locally, in whatever resolution) and reference them from `meta.yaml`, then run:

```bash
pnpm run optimize-images
```

before you `git add`/commit them. This rewrites everything under `content/**/preview-images` (and logos/banners) in place, converting to `.webp`, resizing to fit the limits above, and updating the paths in `meta.yaml` to match.

> [!IMPORTANT]
> Always run this **before** committing images, not after. Committing a full-size PNG/JPG and then optimizing it in a follow-up commit leaves the original bloating the git history forever. Later shrinking a file doesn't remove the earlier, larger blob from history. Optimize first, then commit only the already-resized `.webp` output.

Run `pnpm run validate` (see [below](#6-validate)) afterwards to confirm everything passes.

`previewImages` entries can be a plain path or an object with a title:

```yaml
previewImages:
    - image: ./preview-images/home.webp
      title: Home screen
    - image: ./preview-images/player.webp
      title: Player
```

## 5. Collection-specific fields

### Clients (`content/clients/<slug>/`)

| Field                      | Notes                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `logo`                     | Required                                                                                                                                    |
| `banner`                   | Optional wide banner image                                                                                                                  |
| `platforms`                | Required, at least one. See the [full platform list](packages/schema/src/platforms.ts)                                                      |
| `mainPlatform`             | Optional; must be one of `platforms`                                                                                                        |
| `pricing`                  | `free` \| `subscription` \| `one-time-purchase` (default `free`)                                                                            |
| `music`                    | `none` \| `supported` \| `main` (default `none`)                                                                                            |
| `features`                 | Map of feature-flag id → boolean. See the [full feature list](packages/schema/src/features.ts). Some flags only apply to certain platforms. |
| `relatedPlugins`           | Slugs of companion plugin entries in `content/plugins/`                                                                                     |
| `installationInstructions` | Per-platform install steps. See below.                                                                                                      |

Installation instructions for clients are per-platform. Either write them inline:

```yaml
installationInstructions:
    android: |
        1. Install from the Play Store: ...
    ios: |
        1. Install from the App Store: ...
```

or, preferably for longer instructions, add one markdown file per platform instead:

```
content/clients/<slug>/install/android.md
content/clients/<slug>/install/ios.md
```

(the filename, minus `.md`, must be a valid platform id from `platforms`)

### Plugins (`content/plugins/<slug>/`)

| Field                      | Notes                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| `logo`                     | Required                                                                                       |
| `categories`               | Required, at least one. See the [full category list](packages/schema/src/plugin-categories.ts) |
| `requires`                 | Slugs of other plugin entries this plugin depends on                                           |
| `relatedClients`           | Slugs of companion client entries in `content/clients/`                                        |
| `minimumJellyfinVersion`   | Optional version string                                                                        |
| `installationInstructions` | A single string of steps, inline or in an `install.md` file (not per-platform)                 |

For plugins, installation steps go in `content/plugins/<slug>/install.md`, or inline as a plain string under `installationInstructions` in `meta.yaml`.

### Themes (`content/themes/<slug>/`)

Themes have no `logo`/`banner`/`platforms`/`categories`. The theme's `previewImages` (at least one) carry the visual identity instead. Installation steps work the same way as plugins: `content/themes/<slug>/install.md`, or inline `installationInstructions`.

## 6. Validate

```bash
pnpm run validate
```

This checks that every entry's directory name is a valid lowercase kebab-case slug, validates its schema, verifies referenced images exist and fit the size/dimension limits, and checks cross-references (`relatedPlugins`, `relatedClients`, `requires`) point at real entries. Fix anything it reports before opening a PR.

Also run:

```bash
pnpm run format
```

to apply Prettier formatting (CI checks this too).

To run everything CI runs in one go:

```bash
task check
```

(equivalent to `pnpm run validate && pnpm run schema:json:check && pnpm run format:check && pnpm run build`. See [Taskfile.yml](Taskfile.yml) if you don't have [Task](https://taskfile.dev) installed and want the raw commands.)

## 7. Open a pull request

Commit your new folder and open a PR against `main`. A GitHub Actions workflow re-runs validation and formatting checks automatically. Once it's merged, your entry appears on the site on the next deploy.

A few things worth knowing:

- `dateAdded` and `submittedBy` (and `dateCreated`, if set) become locked after your PR merges. A later PR that changes them will fail validation.
- If your project is a companion pair (e.g. a client + its server plugin), link them both ways with `relatedPlugins`/`relatedClients` so each entry's page cross-links to the other.
