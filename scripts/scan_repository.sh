#!/usr/bin/env bash
set -euo pipefail

tracked="$(git ls-files)"
failed=0

if printf '%s\n' "$tracked" | grep -E '(^|/)\.env($|\.)' | grep -vE '\.env\.example$'; then
  echo "Disallowed environment file is tracked." >&2
  failed=1
fi
if printf '%s\n' "$tracked" | grep -Ei '\.(db|sqlite3?|bak|backup|pem|key|p12|zip)$'; then
  echo "Database, backup, archive, or key material is tracked." >&2
  failed=1
fi

media="$(printf '%s\n' "$tracked" | grep -Ei '\.(gif|jpe?g|png|webp|mp4|mov)$' || true)"
manifest="docs/ASSET_MANIFEST.sha256"
if [[ -n "$media" ]]; then
  if [[ ! -f "$manifest" ]] || ! sha256sum --check --strict "$manifest"; then
    echo "Tracked media is missing from the verified asset manifest." >&2
    failed=1
  fi
  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    if ! grep -Fq "  $path" "$manifest"; then
      echo "Unmanifested media path: $path" >&2
      failed=1
    fi
  done <<< "$media"
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
