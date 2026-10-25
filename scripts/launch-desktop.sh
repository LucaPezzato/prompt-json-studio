#!/usr/bin/env bash
# Prompt JSON Studio - Linux Native Desktop Launcher
REPO_DIR="/home/pez/repos/prompt-json-studio"

if [ -f "$REPO_DIR/src-tauri/target/release/prompt-json-studio" ]; then
    exec "$REPO_DIR/src-tauri/target/release/prompt-json-studio" "$@"
elif [ -f "$REPO_DIR/src-tauri/target/release/app" ]; then
    exec "$REPO_DIR/src-tauri/target/release/app" "$@"
elif [ -f "$REPO_DIR/src-tauri/target/debug/prompt-json-studio" ]; then
    exec "$REPO_DIR/src-tauri/target/debug/prompt-json-studio" "$@"
elif [ -f "$REPO_DIR/src-tauri/target/debug/app" ]; then
    exec "$REPO_DIR/src-tauri/target/debug/app" "$@"
else
    cd "$REPO_DIR" && npm run desktop
fi
