#!/bin/bash

set -euo pipefail

cd ../../app/moviedate
npm install
yarn build
rm -rf node_modules
