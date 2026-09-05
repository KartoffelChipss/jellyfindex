Add to your Custom CSS field:

```css
@import url('https://buesche87.github.io/infinitv/infinitv.css');
:root {
    /* Accent Color */
    --accent-h: 310; /* Hue: Purple */
    --accent-s: 100%; /* Saturation */
    --accent-l: 50%; /* Brightness */

    /* Background Image */
    --bgImage: url('https://example.com/your-background.jpg');

    /* Darkness & Opacity */
    --bgdarkness: 0.6; /* Background Darkness */
    --headeropacity: 0.7; /* Header & Drawer Opacity */
    --itemopacity: 0.8; /* Item Opacity (Card Footer, Detail Ribbon) */

    /* Roundings */
    --rounding-media: 12px;
    --rounding-system: 6px;
}
```

See the [README](https://github.com/buesche87/infinitv#readme) for the full list of customization variables, including disabling the card glow.
