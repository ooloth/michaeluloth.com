#!/usr/bin/env bash
set -e

# Safety checks for production deployment
# Skipped in CI, enforced for local deployments

# Skip checks if running in CI
if [ -n "$CI" ]; then
  echo "✓ Running in CI - skipping safety checks"
  exit 0
fi

echo "🔍 Production deployment safety checks..."
echo ""

# Check 1: Is working tree clean?
if ! git diff-index --quiet HEAD --; then
  echo "❌ Working tree has uncommitted changes"
  echo ""
  echo "Please commit or stash your changes before deploying to production."
  echo "Run: git status"
  exit 1
fi

# Check 2: Are we on main branch?
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "❌ Not on main branch (currently on: $CURRENT_BRANCH)"
  echo ""
  echo "Please switch to main before deploying to production."
  echo "Run: git checkout main"
  exit 1
fi

# Show what we're about to deploy
COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=%B)

echo "✓ Working tree is clean"
echo "✓ On main branch"
echo ""
echo "📦 Ready to deploy:"
echo "   Commit: $COMMIT_HASH"
echo "   Message: $COMMIT_MESSAGE"
echo ""

# Confirmation prompt
read -p "Deploy this commit to PRODUCTION? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled"
  exit 1
fi

echo ""
echo "✓ Proceeding with production deployment..."
