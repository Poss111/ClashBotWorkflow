import { Handler } from 'aws-lambda';
import pino, { P } from "pino";
import { DynamoDBClient, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Team, TeamFromJSON } from 'clash-bot-shared';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export const handler: Handler = async (event, context) => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });

    logger.info({ eventRecieved: event }, 'Recieved event...');
    logger.info({ contextRecieved: context } , 'Recieved context...');

    let queryConditions: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'type = :type',
        ExpressionAttributeNames: {
            "#type": "type"
        },
        ExpressionAttributeValues: {
            ":type": {
                S: "Team"
            },
        }
    };

    if (event.tournamentName && event.tournamentDay && event.serverId) {
        logger.info("Filtering by tournament name '%s', tournament day '%s', and server id '%s'...", event.tournamentName, event.tournamentDay, event.serverId);
        queryConditions = {
            ...queryConditions,
            FilterExpression: '#tournament.#tournamentName = :tournamentName AND #tournament.#tournamentDay = :tournamentDay AND #serverId = :serverId',
            ExpressionAttributeNames: {
                ...queryConditions.ExpressionAttributeNames,
                "#tournament": "tournament",
                "#tournamentName": "tournamentName",
                "#tournamentDay": "tournamentDay",
                "#serverId": "serverId"
            },
            ExpressionAttributeValues: {
                ...queryConditions.ExpressionAttributeValues,
                ":tournamentName": { S: event.tournamentName },
                ":tournamentDay": { S: event.tournamentDay },
                ":serverId": { S: event.serverId }
            }
        }
    } else if (event.tournamentName && event.tournamentDay) {
        logger.info("Filtering by tournament name '%s' and tournament day '%s'...", event.tournamentName, event.tournamentDay);
        queryConditions = {
            ...queryConditions,
            FilterExpression: '#tournament.#tournamentName = :tournamentName AND #tournament.#tournamentDay = :tournamentDay',
            ExpressionAttributeNames: {
                ...queryConditions.ExpressionAttributeNames,
                "#tournament": "tournament",
                "#tournamentName": "tournamentName",
                "#tournamentDay": "tournamentDay"
            },
            ExpressionAttributeValues: {
                ...queryConditions.ExpressionAttributeValues,
                ":tournamentName": { S: event.tournamentName },
                ":tournamentDay": { S: event.tournamentDay }
            }
        }
    } else if (event.tournamentName) {
        logger.info("Filtering by tournament name '%s'...", event.tournamentName);
        queryConditions = {
            ...queryConditions,
            FilterExpression: '#tournament.#tournamentName = :tournamentName',
            ExpressionAttributeNames: {
                ...queryConditions.ExpressionAttributeNames,
                "#tournament": "tournament",
                "#tournamentName": "tournamentName"
            },
            ExpressionAttributeValues: {
                ...queryConditions.ExpressionAttributeValues,
                ":tournamentName": { S: event.tournamentName }
            }
        }
    }

    const dynamoDbClient = new DynamoDBClient({});
    const query = new QueryCommand(queryConditions);

    const results = await dynamoDbClient.send(query);
    const items = results.Items ?? [];

    logger.info("Returned %d records from DynamoDb...", items.length);
    logger.debug({ items }, "Retrieved items from DynamoDB...");

    return items.map((item) => {
        const unmarshalledItem = unmarshall(item);
        return {
            ...unmarshalledItem,
            lastUpdatedAt: new Date(unmarshalledItem.lastUpdatedAt)
        };
    });
};