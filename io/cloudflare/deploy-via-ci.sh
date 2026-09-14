#!/usr/bin/env bash
set -euo pipefail

# Triggers the "Check" workflow on origin/main, which rebuilds the site and
# deploys it to Cloudflare Pages.
#
# Posts live in Notion and are fetched at build time, so publishing one needs a
# rebuild even though nothing in this repo changed. Going through CI rather than
# `npm run deploy:production` runs the metadata and Lighthouse checks against the
# new content before it ships.

readonly WORKFLOW='ci.yml'
readonly BRANCH='main'

# The dispatched run takes a few seconds to appear in the API.
readonly RUN_LOOKUP_ATTEMPTS=10
readonly RUN_LOOKUP_DELAY_SECONDS=2

fail() {
  echo "❌ $1" >&2
  if [ $# -gt 1 ]; then
    echo "" >&2
    echo "$2" >&2
  fi
  exit 1
}

latest_dispatch_run_id() {
  gh run list --workflow="$WORKFLOW" --event=workflow_dispatch --limit=1 --json databaseId --jq '.[0].databaseId // ""'
}

if ! command -v gh >/dev/null 2>&1; then
  fail "GitHub CLI (gh) is not installed." "Install it with: brew install gh"
fi

if ! gh auth status >/dev/null 2>&1; then
  fail "GitHub CLI is not authenticated." "Run: gh auth login"
fi

echo "🔍 Fetching origin/$BRANCH..."
git fetch origin "$BRANCH" --quiet

REMOTE_SHA=$(git rev-parse "origin/$BRANCH")
LOCAL_SHA=$(git rev-parse HEAD)

echo ""
echo "📦 CI will build and deploy origin/$BRANCH:"
echo "   Commit: $REMOTE_SHA"
echo "   Message: $(git log -1 --pretty=%s "origin/$BRANCH")"
echo ""

# This deploys what GitHub has, not what is on disk. Say so when they differ,
# rather than letting a local change look like it shipped.
if [ "$LOCAL_SHA" != "$REMOTE_SHA" ]; then
  CURRENT_BRANCH=$(git branch --show-current)
  echo "⚠️  Local HEAD is $(git rev-parse --short HEAD) on ${CURRENT_BRANCH:-a detached HEAD}, not origin/$BRANCH."
  echo "   Those commits will NOT be deployed. Push them to $BRANCH first if you want them included."
  echo ""
fi

if ! git diff-index --quiet HEAD --; then
  echo "⚠️  You have uncommitted changes. They will NOT be deployed."
  echo ""
fi

REPLY=''
read -r -n 1 -p "Trigger a production deploy from this commit? [y/N] " REPLY || true
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  fail "Deployment cancelled"
fi

PREVIOUS_RUN_ID=$(latest_dispatch_run_id)

echo ""
echo "🚀 Dispatching $WORKFLOW on $BRANCH..."
gh workflow run "$WORKFLOW" --ref "$BRANCH"

RUN_ID=''
for ((attempt = 0; attempt < RUN_LOOKUP_ATTEMPTS; attempt++)); do
  sleep "$RUN_LOOKUP_DELAY_SECONDS"
  CANDIDATE_RUN_ID=$(latest_dispatch_run_id)
  if [ -n "$CANDIDATE_RUN_ID" ] && [ "$CANDIDATE_RUN_ID" != "$PREVIOUS_RUN_ID" ]; then
    RUN_ID="$CANDIDATE_RUN_ID"
    break
  fi
done

echo ""
if [ -n "$RUN_ID" ]; then
  echo "✓ Run started: $(gh run view "$RUN_ID" --json url --jq .url)"
  echo ""
  echo "   Watch it:  gh run watch $RUN_ID"
else
  echo "✓ Dispatched, but the run did not appear within $((RUN_LOOKUP_ATTEMPTS * RUN_LOOKUP_DELAY_SECONDS))s."
  echo ""
  echo "   Find it:   gh run list --workflow=$WORKFLOW"
fi

echo ""
echo "Pushover will notify you when the deploy finishes."
