Plugin Pages allows other Jellyfin plugins to add their own user-facing pages to the web client, while keeping the same theming and style the server owner has already set up. Pages added this way feel more "at home" than the plain custom links Jellyfin offers out of the box.

It's a building block other plugins depend on — Home Screen Sections uses it to add its "Modular Home" settings page to the hamburger menu, for example. It requires File Transformation to be installed first, since that's what lets it patch the served web client.
