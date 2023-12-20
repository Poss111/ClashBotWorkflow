#!/bin/bash

PROFILE_NAME="Master"
REGION="us-east-1"
TABLE_NAME="clash-bot-workflow-development"

for row in $(cat ./setup-data/tournaments.json | jq -r '.[] | @base64'); do
  ITEM=$(echo ${row} | base64 --decode | jq -r '{type: .type, id: .id, tournament: .tournament, date: .date, tournamentDay: .tournamentDay} | map_values({S: .})')
    echo ${ITEM}
  aws dynamodb put-item --table-name ${TABLE_NAME} --item "${ITEM}" --profile ${PROFILE_NAME} --region ${REGION}
done