#!/bin/bash

set -euo pipefail

cd app/moviedate8
npm install
yarn build
rm -rf node_modules
