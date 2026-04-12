#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_NAME="MarkdownViewer.app"
OUTPUT_DIR="$SCRIPT_DIR/build"

rm -rf "$OUTPUT_DIR/$APP_NAME"
mkdir -p "$OUTPUT_DIR"

# Compile AppleScript to .app
osacompile -o "$OUTPUT_DIR/$APP_NAME" "$SCRIPT_DIR/main.applescript"

# Replace default Info.plist
cp "$SCRIPT_DIR/Info.plist" "$OUTPUT_DIR/$APP_NAME/Contents/Info.plist"

echo "Built: $OUTPUT_DIR/$APP_NAME"
