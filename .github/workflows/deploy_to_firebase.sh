#!/bin/bash

set -euo pipefail

SA_KEY="$1"

# set -e
# gcloud billing projects unlink $GOOGLE_CLOUD_PROJECT
# gcloud services enable firebase.googleapis.com
# firebase projects:addfirebase $GOOGLE_CLOUD_PROJECT
# firebase init hosting --project "$GOOGLE_CLOUD_PROJECT"
# gcloud iam service-accounts create deployer-github
# sleep 1
# gcloud projects add-iam-policy-binding "$GOOGLE_CLOUD_PROJECT" --member="serviceAccount:deployer-github@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com" --role="roles/firebasehosting.admin"
# gcloud iam service-accounts keys create gac.json --iam-account "deployer-github@$GOOGLE_CLOUD_PROJECT.iam.gserviceaccount.com"
# echo; echo; echo
# cat gac.json
# echo; echo; echo

cd app

export GOOGLE_APPLICATION_CREDENTIALS="gac.json"
echo "$SA_KEY" > "$GOOGLE_APPLICATION_CREDENTIALS"
npm install -g firebase-tools
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
project_id="$(cat $GOOGLE_APPLICATION_CREDENTIALS | jq -r .project_id)"


cat <<EOF > firebase.json
{
    "hosting": {
        "public": "dist",
        "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
        "rewrites": [{
            "source": "**",
            "destination": "/index.html"
        }]
    }
}
EOF

cat <<EOF > .firebaserc
{
    "projects": {
        "default": "$project_id"
    }
}
EOF

firebase deploy --project "$project_id"
