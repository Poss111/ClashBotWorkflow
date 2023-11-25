import { Handler } from 'aws-lambda';
import pino from "pino";

import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { WebsocketEvent } from 'clash-bot-shared';
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
        const results = await dynamoDbClient.send(new GetItemCommand({
            TableName: process.env.TOPIC_TO_SUBSCRIBERS_TABLE_NAME,
            Key: {
                "topic": { S: topic }
            }
        }));

        let subscribers: string[] = [];

        if (results.Item) {
            subscribers = [...unmarshall(results.Item).subscribers];
        } else {
            logger.info({ topic }, 'No subscribers found...');
        }

        logger.info({ subscribers }, 'Subscribers found...');
        logger.info({ event }, 'Sending payload...');

        const posts = subscribers.map((subscriber) => {
            const requestParams = {
                ConnectionId: subscriber,
                Data: JSON.stringify(event.payload),
            };
            const client = new ApiGatewayManagementApiClient({ endpoint: process.env.WEBSOCKET_API_ENDPOINT })

            return client.send(new PostToConnectionCommand(requestParams));
        });

        const responses = await Promise.all(posts);

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