On Apple Silicon, install via the Homebrew tap:

```sh
brew tap PelagicaApp/pelagica
brew trust PelagicaApp/pelagica
brew install --cask pelagica
```

Then clear the quarantine flag once (the app isn't notarized):

```sh
xattr -dr com.apple.quarantine "/Applications/Pelagica.app"
```

Alternatively, download the `.dmg` from [Releases](https://github.com/PelagicaApp/Pelagica/releases) and right-click > Open to bypass Gatekeeper.
