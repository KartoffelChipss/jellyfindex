Moonbase requires Jellyfin 10.10+ or Emby 4.8+.

### Jellyfin (recommended: plugin catalog)

1. Open the Jellyfin Dashboard, then go to Administration > Plugins > Repositories.
2. Add a repository with name `Moonbase` and URL `https://raw.githubusercontent.com/Moonfin-Client/Plugin/refs/heads/master/manifest.json`.
3. Go to Catalog, find **Moonbase**, and install it.
4. Restart Jellyfin.

### Emby

Emby doesn't have a catalog for this plugin, so it's a manual drop-in:

1. Download the latest `Moonfin.Emby-x.x.x.x.zip` from the [Releases page](https://github.com/Moonfin-Client/Plugin/releases).
2. Extract `Emby.Plugins.Moonfin.dll`, `SharpCompress.dll`, and the `web` folder into your Emby plugins folder.
3. Restart Emby.

Once installed, the Moonfin web app is served at `https://your-server-host/Moonfin/Web/`. See the [wiki](https://github.com/Moonfin-Client/Plugin/wiki/Installation) for platform-specific plugin folder paths and troubleshooting.
