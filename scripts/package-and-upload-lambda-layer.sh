#!/bin/bash

# Directory to zip
DIR="../functions/clash-bot-layer/node_modules"

# S3 bucket name
BUCKET_NAME="$1"

# Zip file name
ZIP_FILE="lambda_layer.zip"

# S3 key
S3_KEY="layers/$ZIP_FILE"

# Create a temporary directory
TEMP_DIR=$(mktemp -d -t nodejs)

# Copy the subdirectory to the temporary directory
cp -r $DIR $TEMP_DIR/

# Zip the directory
zip -r $ZIP_FILE $TEMP_DIR/*

# Upload the zip file to S3
aws s3 cp $ZIP_FILE s3://$BUCKET_NAME/$S3_KEY --profile Master

# Remove the zip file and the temporary directory
rm $ZIP_FILE
rm -r $TEMP_DIR