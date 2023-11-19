import { DeleteItemCommand, DeleteItemCommandInput, DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
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
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Connected' }),
        };
    } else if ('$disconnect' === routeKey) {
        logger.info("Received disconnect event...");
        const getCommand: GetItemCommandInput = {
            TableName: process.env.SUBSCRIBER_TO_TOPIC_TABLE_NAME,
            Key: {
                "subscriber": { S: event.requestContext.connectionId }
            }
        };

        const subscriberTopics = await client.send(new GetItemCommand(getCommand));

        logger.info({ subscriberTopics }, "Subscriber topics.");

        const subscriberToTopics = unmarshall(subscriberTopics.Item!);

        if (subscriberToTopics.topics === undefined || subscriberToTopics.topics.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Did not disconnect successfully' }),
            };
        } else {
            logger.info({ subscriberToTopics }, "Subscriber to topics.", );

            const deleteSubscriberToTopics: DeleteItemCommandInput = {
                TableName: process.env.TOPIC_TO_SUBSCRIBER_TABLE_NAME,
                Key: {
                    "subscriber": { S: event.requestContext.connectionId }
                }
            };

            const updateCommandPromises = [...subscriberToTopics.topics].map((topic: string) => {
                return client.send(new UpdateItemCommand({
                    TableName: process.env.SUBSCRIBER_TO_TOPIC_TABLE_NAME,
                    Key: {
                    "topic": { S: topic }
                    },
                    ExpressionAttributeNames: {
                    "#S": "subscribers"
                    },
                    ExpressionAttributeValues: {
                    ":val": { SS: [event.requestContext.connectionId] }
                    },
                    UpdateExpression: "DELETE #S :val",
                }));
            });
            try {
                await Promise.all([
                    ...updateCommandPromises,
                    client.send(new DeleteItemCommand(deleteSubscriberToTopics))
                ]);
            } catch(error) {
                logger.error({ error }, "Error deleting subscriber to topics.");
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Did not disconnect successfully' }),
                };
            }
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Disconnected' }),
            };
        }
    } else if ('subscribe' === routeKey) {
        logger.info("Received message event...");
        let topic = "";
        if (event.body !== undefined) {
            topic = JSON.parse(event.body).topic;
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Missing topic' }),
            };
        }
        const updateTopicToSubscribers: UpdateItemCommandInput = {
            TableName: process.env.TOPIC_TO_SUBSCRIBER_TABLE_NAME,
            Key: {
                "topic": { S: topic },
            },
            ExpressionAttributeNames: {
                "#S": "subscribers"
            },
            ExpressionAttributeValues: {
                ":val": { SS: [event.requestContext.connectionId] }
            },
            UpdateExpression: "ADD #S :val"
        };
        const updateSubscriberToTopics: UpdateItemCommandInput = {
            TableName: process.env.SUBSCRIBER_TO_TOPIC_TABLE_NAME,
            Key: {
                "subscriber": { S: event.requestContext.connectionId },
            },
            ExpressionAttributeNames: {
                "#S": "topics"
            },
            ExpressionAttributeValues: {
                ":val": { SS: [topic] }
            },
            UpdateExpression: "ADD #S :val"
        };
        try {
            await Promise.all([
                client.send(new UpdateItemCommand(updateTopicToSubscribers)),
                client.send(new UpdateItemCommand(updateSubscriberToTopics))
            ]);
        } catch(error) {
            logger.error({ error }, "Error updating topic to subscribers.");
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Did not subscribe successfully' }),
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Subcribed to '${topic}'` }),
        };
    }

    // Default response
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Success' }),
    };
};
