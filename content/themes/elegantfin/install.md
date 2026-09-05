Paste the following into a Custom CSS box:

```css
@import url('https://cdn.jsdelivr.net/gh/lscambo13/ElegantFin@main/Theme/ElegantFin-jellyfin-theme-build-latest-minified.css');
```

**Server-side (applies to everyone):**

1. Open **Dashboard** from the Administration tab in Settings.
2. Select the **Branding** tab (Jellyfin 10.11+) from the sidebar.
3. Scroll down to the **Custom CSS** code box.
4. Paste the code above and click **Save**.

**Client-side (applies to your account only):**

1. Open the **Display** tab in Settings.
2. Scroll down to the **Custom CSS** code box.
3. Paste the code above and click **Save**.

On Jellyfin v12, set **User Settings → Display → Display Mode** to `Desktop (Legacy)` on desktop or `Mobile (Legacy)` on mobile. The new non-legacy UI isn't fully supported yet.
