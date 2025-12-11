# Consent-free

Consent-free is a simple tool that allows users to browse websites without being tracked or asked for consent regarding 
cookies and other tracking mechanisms. It automatically blocks consent pop-ups and tracking scripts, after the user has
configured everything that should be blocked.

This plugin does not block tracking scripts etc. It just gives you the ability to remove consent pop-ups and apply custom styles to
elements on the page. In a perfect world, removing the consent-popups would be enough to avoid tracking, but in reality, 
you might want to use this tool in combination with other privacy tools like uBlock Origin or Privacy Badger.

## Features
- Blocks consent pop-ups on websites
- Add custom styles to element (some sites may require specific styles to show content properly -> overflow:hidden on body for example)
- Easy to use configuration file
- Lightweight and fast

## Future Plans
- Add more blocking options (e.g., specific scripts, iframes)
- Improve the user interface for configuration
- Add support for more browsers

## Feature list
[x] Block consent pop-ups
[x] Custom styles for elements
[ ] Support for more browsers
[ ] predefined rules for popular cookie consent managers
-- this only works partially, as many sites use custom implementations
e.g. "bild.de" uses a custom implementation that is not covered by predefined rules as there adblocker detections breaks the
page for automatic blocking
[ ] Option to select elements by mouse click
