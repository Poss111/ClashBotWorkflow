import { Handler } from 'aws-lambda';
import pino from "pino";

import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { SUBSCRIPTION_TYPE, WebsocketEvent } from 'clash-bot-shared';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export const handler: Handler = async (event: WebsocketEvent) => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });
    logger.info({ eventRecieved: event }, 'Recieved event...');
    try {

        let topic = "";

        if (event.requestId) {
            topic = event.requestId;
        } else {
            throw new Error("Missing requestId");
        }

        logger.info({ topic }, 'Retrieving subscriptions to topic...');

        const dynamoDbClient = new DynamoDBClient({});

        const topics = [topic, SUBSCRIPTION_TYPE.WATCH_ALL];
        logger.info({ topics }, 'Retrieving subscriptions to topics...')
        const getTopicCommands = topics.map((topic) => new GetItemCommand({
            TableName: process.env.TOPIC_TO_SUBSCRIBERS_TABLE_NAME,
            Key: {
                "topic": { S: topic }
            }
        }));

        const results = await Promise.all(getTopicCommands.map((command) => dynamoDbClient.send(command)));

        const subscribers: string[] = [];

        if (results.length > 0) {
            for (const getItemOutput of results) {
                if (getItemOutput.Item !== undefined && getItemOutput.Item.subscribers !== undefined) {
                    subscribers.push(...unmarshall(getItemOutput.Item).subscribers);
                }
            }
        } else {
            logger.info({ topic }, 'No subscribers found...');
            return {
                posts: [],
                topic,
                payload: event.payload
            }
        }

        logger.info({ subscribers }, 'Subscribers found...');
        logger.info({ event }, 'Sending payload...');

        const responses = await Promise.all(subscribers.map((subscriber) => {
            const requestParams = {
                ConnectionId: subscriber,
                Data: JSON.stringify(event.payload),
            };
            const client = new ApiGatewayManagementApiClient({ endpoint: process.env.WEBSOCKET_API_ENDPOINT })

            return client.send(new PostToConnectionCommand(requestParams));
        }));

        return {
            posts: responses,
            topic,
            payload: event.payload
        };
    } catch (error) {
        logger.error(error, "Failed.");
        return { 
            error: 'Failed to publish to websocket',
            stack: error
        };
    }
};