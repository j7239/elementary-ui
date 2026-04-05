.PHONY: pub pub-dry sync sync-dry reset explore

# FTP Configuration
FTP_HOST = jordankellydesign.com
FTP_USER = jordan@jordankellydesign.com
FTP_DIR = /public_html/kinferra/elementary-ui-demo

# Files/directories to ignore during pub/sync
EXCLUDE = --exclude .git --exclude .github --exclude .claude --exclude .vscode \
	--exclude node_modules --exclude .DS_Store \
	--exclude Makefile --exclude package.json --exclude package-lock.json \
	--exclude vite.config.js --exclude build.js \
	--exclude src --exclude scripts --exclude docs --exclude test-envs \
	--exclude dist --exclude playwright-report \
	--exclude .gitignore --exclude .env --exclude LICENSE --exclude README.md

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
