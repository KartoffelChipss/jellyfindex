**Jellyfin v11:**

```css
@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@main/Finimalism11.css');
```

**Jellyfin v12:**

```css
@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@main/Finimalism12.css');
```

Paste into your Custom CSS box (Dashboard → Branding, or your own Display settings).

Customize with CSS variables after the import:

```css
@import url('https://cdn.jsdelivr.net/gh/tedhinklater/finimalism@main/Finimalism11.css');
:root {
    --accent: 202, 20, 20;
    --backdropBlur: blur(0px);
    --rounding: 0.8em;
    --tint: 0, 0, 0;
}
```
