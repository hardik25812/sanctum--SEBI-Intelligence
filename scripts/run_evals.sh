#!/bin/bash
set -e

COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "no-git")
echo "Running eval suite against commit: $COMMIT"

cd "$(dirname "$0")/.."
python evals/runner.py --suite all --commit "$COMMIT"

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "EVAL SUITE FAILED (exit code $EXIT_CODE)"
  exit $EXIT_CODE
fi

echo "All eval suites passed."
