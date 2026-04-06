.PHONY: pub pub-dry sync sync-dry reset explore

# FTP Configuration
FTP_HOST = jordankellydesign.com
FTP_USER = jordan@jordankellydesign.com
FTP_DIR = /public_html/kinferra/elm-ui-demo

# Files/directories to ignore during pub/sync.
# Keep deployment focused on assets needed by the webview runtime.
EXCLUDE = \
	-x ^\. \
	-x Makefile \
	-x node_modules/ \
	-x scripts/ \
	-x src/ \
	-x docs/ \
	-x test-envs/ \
	-x playwright-report/ \
	-x component-assets/ \
	-x components/manifest.json \
	-x build.js \
	-x vite.config.js \
	-x package.json \
	-x package-lock.json \
	-x README.md \
	-x LICENSE \
	-x mini-pad-sample.mp4 \
	-x \.sh$$ \
	-x video-clips.json

# Publish to FTP (actual upload) - prompts for password
pub:
	@echo "Publishing to FTP..."
	@lftp -u $(FTP_USER) $(FTP_HOST) -e "set ftp:ssl-allow no; mkdir -p $(FTP_DIR); mirror -R $(EXCLUDE) . $(FTP_DIR); chmod -R 755 $(FTP_DIR); quit"
	@echo "✓ Published successfully!"

# Dry run - show what would be uploaded
pub-dry:
	@echo "Dry run - showing files that would be uploaded:"
	@lftp -u $(FTP_USER) $(FTP_HOST) -e "set ftp:ssl-allow no; mirror -R -n $(EXCLUDE) . $(FTP_DIR); quit"
	@echo "✓ Dry run complete"

# Sync remote to local (download new/updated remote files, but local files take priority)
sync:
	@echo "Syncing from remote (local files have priority)..."
	@lftp -u $(FTP_USER) $(FTP_HOST) -e "set ftp:ssl-allow no; mirror --only-newer $(EXCLUDE) $(FTP_DIR) .; quit"
	@echo "✓ Sync complete!"

# Sync dry run - show what would be downloaded
sync-dry:
	@echo "Dry run - showing files that would be synced:"
	@lftp -u $(FTP_USER) $(FTP_HOST) -e "set ftp:ssl-allow no; mirror --only-newer --dry-run $(EXCLUDE) $(FTP_DIR) .; quit"
	@echo "✓ Dry run complete"

# Reset remote - wipe remote directory and upload local files fresh
reset:
	@echo "Resetting remote (clearing and re-uploading)..."
	@lftp -u $(FTP_USER) $(FTP_HOST) -e "set ftp:ssl-allow no; rm -rf $(FTP_DIR); mkdir -p $(FTP_DIR); mirror -R $(EXCLUDE) . $(FTP_DIR); chmod -R 755 $(FTP_DIR); quit"
	@echo "✓ Remote reset complete!"

# Download remote files to temp dir and open in VS Code
explore:
	@echo "Downloading remote files..."
	@mkdir -p /tmp/mini-dj-pad-remote
	@lftp -u $(FTP_USER) $(FTP_HOST) -e "set ftp:ssl-allow no; mirror $(FTP_DIR) /tmp/mini-dj-pad-remote; quit"
	@code /tmp/mini-dj-pad-remote
	@echo "✓ Opened remote files in VS Code"
