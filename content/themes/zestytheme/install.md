For Jellyfin `v10.11+`, paste into **Dashboard → Branding → Custom CSS**:

```css
@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/theme.css');
```

For Jellyfin `v10.10`, use the legacy build instead:

```css
@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@legacy/v10.10/theme.css');
```

Then enable **Backdrops** for every device using this theme (**Settings → Display → Backdrops**).

Optional color scheme presets (add **one**, after the theme import), e.g. Blue:

```css
@import url('https://cdn.jsdelivr.net/gh/stpnwf/ZestyTheme@latest/colorschemes/blue.css');
```

See the [README](https://github.com/stpnwf/ZestyTheme#readme) for all available color schemes.
