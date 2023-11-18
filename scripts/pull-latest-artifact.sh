#!/bin/bash

BUCKET_NAME=${1}
ARTIFACT_NAME=${2}
ENVIRONMENT=${3}

# List objects in the S3 bucket path
OBJECTS=$(aws s3 ls s3://$BUCKET_NAME//artifacts/$ARTIFACT_NAME/$ENVIRONMENT --recursive --profile=Master | awk '{print $4}')

# Extract numbers from the object names and find the maximum
MAX_NUMBER=0
for object in $OBJECTS; do
  NUMBER=$(basename $object | grep -o -E '[0-9]+')
  if [[ "$NUMBER" -gt "$MAX_NUMBER" ]]; then
    MAX_NUMBER=$NUMBER
  fi
done

echo "Maximum number: $MAX_NUMBER"