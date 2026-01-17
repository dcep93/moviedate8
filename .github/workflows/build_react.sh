#!/bin/bash

set -euo pipefail

# npm create vite@latest app -- --template react-ts --no-interactive

cd app
npm install
yarn build
rm -rf node_modules
