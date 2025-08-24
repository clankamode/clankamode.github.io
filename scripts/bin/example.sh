#!/bin/bash

# Example shell script
# Make executable with: chmod +x scripts/bin/example.sh

# Exit on error
set -e

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "Running example shell script..."
echo "Project root: $PROJECT_ROOT"

# Your script logic here
