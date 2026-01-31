#!/usr/bin/env bash
# Clear pending broadcast state so the next deploy is fresh (new nonce).
# Run this after "Failure on receiving a receipt" so Forge won't re-send the same tx
# and trigger "Transaction Already Imported" or rate-limit ban.
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHAIN_DIR="$DIR/broadcast/Deploy.s.sol/420420417"
CACHE_DIR="$DIR/cache/Deploy.s.sol/420420417"
rm -f "$CHAIN_DIR/run-latest.json" "$CACHE_DIR/run-latest.json"
echo "Cleared pending deploy state. Next 'forge script ... --broadcast' will use a fresh nonce."
