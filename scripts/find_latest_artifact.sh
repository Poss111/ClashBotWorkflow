#!/bin/bash

BUCKET_NAME=${1}
ARTIFACT_NAME=${2}
ENVIRONMENT=${3}

# List objects in the S3 bucket path
OBJECTS=$(aws s3 ls s3://$BUCKET_NAME/artifacts/$ARTIFACT_NAME/$ENVIRONMENT --recursive | awk '{print $4}')

# Extract numbers from the object names and find the maximum number artifact
ARTIFACT_PATH=""
for object in $OBJECTS; do
  NUMBER=$(basename $object | grep -o -E '[0-9]+')
  if [[ "$NUMBER" -gt "$MAX_NUMBER" ]]; then
    ARTIFACT_PATH=$object
  fi
done

# Check if ARTIFACT_PATH is empty
if [[ -z "$ARTIFACT_PATH" ]]; then
  echo "Error: No artifact path found" >&2
  exit 1
fi

echo "PATH: $ARTIFACT_PATH"

# Set ARTIFACT_PATH as an output
echo "::set-output name=artifact-path::$ARTIFACT_PATH"