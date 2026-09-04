Pelagica is a web, desktop, and TV client for <a href="https://jellyfin.org">Jellyfin</a> built using React. It aims to provide a fast, modern, and customizable user experience for browsing and watching your media library. It's available as a self-hosted web app, a native desktop app for macOS, Windows, and Linux, and a TV app for Samsung Tizen and LG webOS.

## Features

- **Customizable Sections:** Tailor your homepage with sections like "Continue Watching", "Recently Added", or completely custom queries.
- **Media Bars:** Add custom media bars to feature specific content.
- **Search:** Quickly find media across your library from anywhere using `Cmd+K` / `Ctrl+K`.
- **Video Player:** Integrated video player for movies and TV shows.
- **Music Player:** A music player that allows you to listen to your music albums or playlists while browsing your library.
- **Responsive Design:** Works seamlessly on both desktop and mobile devices.
- **Desktop App:** Native apps for macOS, Windows, and Linux, built with [Wails](https://v3.wails.io).
- **Theming:** Light and dark mode support as well as custom themes
- **Localization:** Supports multiple languages through [community contributions](#localization).

If you want to suggest new features or report bugs, please use the [GitHub Issues](https://github.com/KartoffelChipss/pelagica/issues) section.

### Integrated Services

- **Seerr:** Discover new movies and TV shows to watch, and request them without leaving Pelagica.
- **Streamystats:** Get your streamystats recommendations directly on your home page.
- **kefintweaks Watchlist:** View and manage your kefintweaks watchlist within Pelagica.

## Web Demo

You can find a live demo of Pelagica web at:

https://demo.pelagica.app/

The demo instance has the `jellyfin.streamyfin.app` server with a username preconfigured, so you just have to click "Login" to test it out. If your own Jellyfin server is publicly accessible, you can also use that by entering the server URL and your credentials.

For production use, you should self-host Pelagica using Docker or another method.

Thank you to [Streamyfin](https://streamyfin.app/) for providing a demo Jellyfin server for testing!

## Discord

For discussions about Pelagica, join the [JellyfinCommunity](https://discord.gg/VKqprjh3Wr) and head to the `#pelagica` channel.
