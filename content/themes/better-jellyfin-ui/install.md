Go to **Dashboard → General → Branding → Custom CSS** and paste:

```css
@import url('https://cdn.jsdelivr.net/gh/tromoSM/better-jellyfin-ui@main/theme.css');
```

Click **Save** and refresh the page.

> **Firefox users:** enable `layout.css.backdrop-filter.enabled` and `gfx.webrender.all` in `about:config` to see the blur effect.

Optional add-ons (paste after the base import) include a floating header, a high-contrast interface, and a scale-up hover animation for cards. See the [README](https://github.com/tromoSM/better-jellyfin-ui#readme) for each snippet.
