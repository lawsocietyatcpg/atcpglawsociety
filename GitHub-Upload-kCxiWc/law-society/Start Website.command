#!/bin/zsh
set -e
cd -- "$(dirname -- "$0")"
printf '\nLaw Society ATC Penang\nOpen http://127.0.0.1:4173 in your browser.\nKeep this window open while using the local website.\nPress Control+C to stop it.\n\n'
exec python3 -B server.py
