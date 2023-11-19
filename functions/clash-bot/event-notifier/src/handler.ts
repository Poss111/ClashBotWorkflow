import { DeleteItemCommand, DeleteItemCommandInput, DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyResultV2, APIGatewayProxyWebsocketEventV2, APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda';
import pino from "pino";

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event: APIGatewayProxyWebsocketEventV2): Promise<APIGatewayProxyResultV2<APIGatewayProxyResultV2>> => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });
    logger.info({
        event
    }, "Received event...");

    const {
        requestContext: { connectionId, routeKey },
    } = event;

    logger.info(routeKey, "Received route key...");

    const client = new DynamoDBClient({});

    if ('$connect' === routeKey) {
        logger.info("Received connect event...");
        const persistItem: PutItemCommandInput = {
            TableName: process.env.TABLE_NAME,
            Item: {
                "connectionId": { S: connectionId },
                "context": { S: "TBA" }
            }
        };
        await client.send(new PutItemCommand(persistItem));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Connected' }),
        };
    } else if ('$disconnect' === routeKey) {
        logger.info("Received disconnect event...");
        const deleteItem: DeleteItemCommandInput = {
            TableName: process.env.TABLE_NAME,
            Key: {
                "connectionId": { S: connectionId }
            }
        };
        await client.send(new DeleteItemCommand(deleteItem));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Disconnected' }),
        };
    } else if ('$message' === routeKey) {
        logger.info("Received message event...");
        const persistItem: PutItemCommandInput = {
            TableName: process.env.TABLE_NAME,
            Item: {
                "connectionId": { S: connectionId },
                "context": { S: "TBA" }
            }
        };
        await client.send(new PutItemCommand(persistItem));
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message received' }),
        };
    }

    // Default response
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Success' }),
    };
};
