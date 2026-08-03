#!/usr/bin/env bash
set -euo pipefail

tracked="$(git ls-files)"
failed=0

if printf '%s\n' "$tracked" | grep -E '(^|/)\.env($|\.)' | grep -vE '\.env\.example$'; then
  echo "Disallowed environment file is tracked." >&2
  failed=1
fi
if printf '%s\n' "$tracked" | grep -Ei '\.(db|sqlite3?|bak|backup|pem|key|p12|gif|jpe?g|png|webp|mp4|mov|zip)$'; then
  echo "Undocumented database, backup, key, or binary media is tracked." >&2
  failed=1
fi

secret_pattern='(-----BEGIN [A-Z ]*PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,})'
unix_home_pattern='(/home'"/[^[:space:]]+|/Users"'/[^[:space:]]+)'
windows_home_pattern='[A-Za-z]:\\'"Users"'\\'
if git grep --cached -nE "$secret_pattern|$unix_home_pattern|$windows_home_pattern" \
  -- ':!package-lock.json'; then
  echo "Potential secret or absolute personal path found." >&2
  failed=1
fi
if git grep --cached -nE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' \
  -- ':!package-lock.json' | grep -vE '@example\.(com|org|net)'; then
  echo "Non-reserved email address found." >&2
  failed=1
fi
exit "$failed"
