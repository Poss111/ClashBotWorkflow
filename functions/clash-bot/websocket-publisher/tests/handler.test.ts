import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { handler } from '../src/handler';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { WebsocketEvent } from 'clash-bot-shared';
import { Context } from 'aws-lambda';

describe('Placeholder', () => {

    test('Happy Path', async () => {
        const topicKey = 'topic';
        const event = {
            requestId: topicKey,
            payload: {
                message: 'message'
            }
        };
        const context = {};

        const dynamoClientMock = mockClient(DynamoDBClient);
        const apiGatewayMock = mockClient(ApiGatewayManagementApiClient);

        dynamoClientMock.on(GetItemCommand)
            .resolves({
                Item: {
                    topic: {
                        S: topicKey
                    },
                    subscribers: {
                        SS: [
                            'connectionId'
                        ]
                    }
                }
            });
        apiGatewayMock.on(PostToConnectionCommand)
            .resolves({});

        const result = await handler(event as WebsocketEvent, context as Context, () => { });
        expect(result).toBeDefined();
        expect(dynamoClientMock).toHaveReceivedCommandWith(GetItemCommand, {
            TableName: process.env.TOPIC_TO_SUBSCRIBERS_TABLE_NAME,
            Key: {
                "topic": { S: topicKey }
            }
        });
        expect(apiGatewayMock).toHaveReceivedCommandWith(PostToConnectionCommand, {
            ConnectionId: 'connectionId',
            Data: JSON.stringify(event.payload)
        });
    });

    test('No topics subscribers', async () => {
        const topicKey = 'topic';
        const event = {
            requestId: topicKey,
            payload: {
                message: 'message'
            }
        };
        const context = {};

        const dynamoClientMock = mockClient(DynamoDBClient);
        const apiGatewayMock = mockClient(ApiGatewayManagementApiClient);

        dynamoClientMock.on(GetItemCommand)
            .resolves({
                Item: {}
            });
        apiGatewayMock.on(PostToConnectionCommand)
            .resolves({});

        const result = await handler(event as WebsocketEvent, context as Context, () => { });
        expect(result).toBeDefined();
        expect(dynamoClientMock).toHaveReceivedCommandWith(GetItemCommand, {
            TableName: process.env.TOPIC_TO_SUBSCRIBERS_TABLE_NAME,
            Key: {
                "topic": { S: topicKey }
            }
        });
        expect(apiGatewayMock).not.toHaveReceivedCommand(PostToConnectionCommand);
    });

    test('No topics subscribers', async () => {
        const topicKey = 'topic';
        const event = {
            requestId: topicKey,
            payload: {
                message: 'message'
            }
        };
        const context = {};

        const dynamoClientMock = mockClient(DynamoDBClient);
        const apiGatewayMock = mockClient(ApiGatewayManagementApiClient);

        dynamoClientMock.on(GetItemCommand)
            .resolves({});
        apiGatewayMock.on(PostToConnectionCommand)
            .resolves({});

        const result = await handler(event as WebsocketEvent, context as Context, () => { });
        expect(result).toBeDefined();
        expect(dynamoClientMock).toHaveReceivedCommandWith(GetItemCommand, {
            TableName: process.env.TOPIC_TO_SUBSCRIBERS_TABLE_NAME,
            Key: {
                "topic": { S: topicKey }
            }
        });
        expect(apiGatewayMock).not.toHaveReceivedCommand(PostToConnectionCommand);
    });

    test('Error Case - Missing requestId', async () => {
        const event = {};
        const context = {};

        const results = await handler(event as WebsocketEvent, context as Context, () => { });
        expect(results).toEqual({
            error: "Failed to publish to websocket",
            stack: new Error("Missing requestId")
        });
    });

});