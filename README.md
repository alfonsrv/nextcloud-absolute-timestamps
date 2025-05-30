# Absolute Timestamps 📅🔍

**✨ ATTENTION: This app is vibe-coded and more of a hotpatch**

A minimal Nextcloud app that replaces all relative timestamps with absolute ones in YYYY-MM-DD HH:MM format.

## Functionality 🛠️

- Converts all relative timestamps (like "2 days ago") to absolute format (YYYY-MM-DD HH:MM)
- Works everywhere in the Nextcloud files interface
- No configuration options / settings – it's just a hotpatch
- Ensures the Modified column is wide enough to display the full timestamp


## Installation 👾

1. Clone this repository into your Nextcloud apps directory:
   ```
   cd /path/to/nextcloud/apps
   git clone https://github.com/alfonsrv/nextcloud-absolute-timestamps.git absolute_timestamps
   ```

2. Enable the app:
   ```
   php occ app:enable absolute_timestamps
   ```


## License 📜

AGPL-3.0-or-later
