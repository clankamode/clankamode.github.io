#!/bin/sh
# Run once after cloning or when hooks change.
# Installs git hooks from scripts/hooks/ into .git/hooks/.

set -e

HOOKS_DIR="$(git rev-parse --show-toplevel)/scripts/hooks"
GIT_HOOKS_DIR="$(git rev-parse --show-toplevel)/.git/hooks"

for hook in "$HOOKS_DIR"/*; do
  name="$(basename "$hook")"
  target="$GIT_HOOKS_DIR/$name"
  cp "$hook" "$target"
  chmod +x "$target"
  echo "Installed hook: $name"
done

echo "✅ Git hooks installed."
