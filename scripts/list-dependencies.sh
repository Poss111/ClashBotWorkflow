#!/bin/bash

# Directory to search
DIR="../functions/clash-bot"

# Find all package.json files in the directory
FILES=$(find $DIR -name 'node_modules' -prune -o -name 'package.json' -print)

# Initialize an empty string to hold all dependencies
ALL_DEPENDENCIES=""

# Loop over each file
for FILE in $FILES
do
  # Extract dependencies and devDependencies
  DEPENDENCIES=$(jq -r '.dependencies | to_entries[] | .key + "@" + .value' $FILE)
  
  # Add the dependencies from this file to the list of all dependencies
  ALL_DEPENDENCIES="$ALL_DEPENDENCIES $DEPENDENCIES"
done

# Remove duplicate dependencies
ALL_DEPENDENCIES=$(echo $ALL_DEPENDENCIES | tr ' ' '\n' | sort -u | tr '\n' ' ')

# Generate the npm install command
echo "npm install --save-dev $ALL_DEPENDENCIES"