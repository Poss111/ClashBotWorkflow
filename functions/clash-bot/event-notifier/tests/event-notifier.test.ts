import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyResultV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { handler } from '../src/handler';
import { DeleteItemCommand, DeleteItemCommandInput, DynamoDBClient, GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('Handle Websocket connection requests', () => {

    test('If a websocket connection reqeust is recieved, it should post the details to DynamoDb to save the state.', async () => {
        const event = createMockConnectEvent();
        const context = setupContext();

        const result = await handler(event, context, () => { });
        expect(result).toBeDefined();
        expect((result as any).statusCode).toBe(200);
        expect((result as any).body).toBe('{\"message\":\"Connected\"}');
    });

    test('If a websocket disconnect reqeust is recieved, it should post the details to DynamoDb to save the state.', async () => {
        const event = createMockDisconnectEvent();
        const context = setupContext();
        const topic = "mockTopic";

        const client = mockClient(DynamoDBClient);

        client.on(DeleteItemCommand)
            .resolves({});
        client.on(GetItemCommand)
            .resolves({
                Item: {
                    "topics": {
                        SS: [topic]
                    }
                }
            });
        client.on(UpdateItemCommand)
            .resolves({});

        const getCommand: GetItemCommandInput = {
            TableName: process.env.SUBSCRIBER_TO_TOPIC_TABLE_NAME,
            Key: {
                "subscriber": { S: event.requestContext.connectionId }
            }
        };

        const expectedDeleteCommandForSubscriberToTopic: DeleteItemCommandInput = {
            TableName: process.env.TABLE_NAME,
            Key: {
                "subscriber": { S: event.requestContext.connectionId }
            }
        };

        const expectedDeleteCommandForTopicToSubscriber: UpdateItemCommandInput = {
            TableName: process.env.TABLE_NAME,
            Key: {
              "context": { S: topic }
            },
            ExpressionAttributeNames: {
              "#S": "subscribers"
            },
            ExpressionAttributeValues: {
              ":val": { SS: [event.requestContext.connectionId] }
            },
            UpdateExpression: "DELETE #S :val",
        };
        

        const result = await handler(event, context, () => { });
        expect(result).toBeDefined();
        expect((result as any).statusCode).toBe(200);
        expect((result as any).body).toBe('{\"message\":\"Disconnected\"}');
        expect(client).toHaveReceivedCommandWith(GetItemCommand, getCommand);
        expect(client).toHaveReceivedCommandWith(UpdateItemCommand, expectedDeleteCommandForTopicToSubscriber);
        expect(client).toHaveReceivedCommandWith(DeleteItemCommand, expectedDeleteCommandForSubscriberToTopic);
    });

    test('If a websocket subscribe request is recieved, it should post the details to DynamoDb to save the state.', async () => {
        const event = createMockMessageEvent();
        const context = setupContext();
        const topic = JSON.parse(event.body ?? "{}").topic;

        const client = mockClient(DynamoDBClient);

        client.on(UpdateItemCommand)
            .resolves({});

        const expectedUpdateItemInput: UpdateItemCommandInput = {
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

        const expectedUpdateItemInputSubscriberToTopics: UpdateItemCommandInput = {
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

        const result = await handler(event, context, () => { });
        expect(result).toBeDefined();
        expect((result as any).statusCode).toBe(200);
        expect((result as any).body).toBe(`{\"message\":\"Subcribed to '${topic}'\"}`);
        expect(client).toHaveReceivedCommandWith(UpdateItemCommand, expectedUpdateItemInput);
        expect(client).toHaveReceivedCommandWith(UpdateItemCommand, expectedUpdateItemInputSubscriberToTopics);
    });

});

const setupContext = () => {
    return {
        callbackWaitsForEmptyEventLoop: false,
        functionName: '',
        functionVersion: '',
        invokedFunctionArn: '',
        memoryLimitInMB: '',
        awsRequestId: '',
        logGroupName: '',
        logStreamName: '',
        getRemainingTimeInMillis: function (): number {
            throw new Error('Function not implemented.');
        },
        done: function (error?: Error | undefined, result?: any): void {
            throw new Error('Function not implemented.');
        },
        fail: function (error: string | Error): void {
            throw new Error('Function not implemented.');
        },
        succeed: function (messageOrObject: any): void {
            throw new Error('Function not implemented.');
        }
    };
}

const createMockConnectEvent = (): APIGatewayProxyWebsocketEventV2 => {
    return {
        requestContext: {
            apiId: 'sampleApiId',
            domainName: 'sampleDomainName',
            requestId: 'sampleRequestId',
            routeKey: '$connect',
            stage: 'dev',
            messageId: 'sampleMessageId',
            eventType: 'CONNECT',
            extendedRequestId: 'sampleExtendedRequestId',
            requestTime: 'sampleRequestTime',
            messageDirection: 'IN',
            connectedAt: Date.now(),
            requestTimeEpoch: Date.now(),
            connectionId: 'sampleConnectionId'
        },
        isBase64Encoded: false
    };
};

const createMockDisconnectEvent = (): APIGatewayProxyWebsocketEventV2 => {
    return {
        requestContext: {
            apiId: 'sampleApiId',
            domainName: 'sampleDomainName',
            requestId: 'sampleRequestId',
            routeKey: '$disconnect',
            stage: 'dev',
            messageId: 'sampleMessageId',
            eventType: 'CONNECT',
            extendedRequestId: 'sampleExtendedRequestId',
            requestTime: 'sampleRequestTime',
            messageDirection: 'IN',
            connectedAt: Date.now(),
            requestTimeEpoch: Date.now(),
            connectionId: 'sampleConnectionId'
        },
        isBase64Encoded: false
    };
};

const createMockMessageEvent = (): APIGatewayProxyWebsocketEventV2 => {
    return {
        requestContext: {
            routeKey: "subscribe", 
            messageId: "OqOHdcL-oAMCKcw=", 
            eventType: "MESSAGE", 
            extendedRequestId: "OqOHdHnOoAMFozw=", 
            requestTime: "19/Nov/2023:19:09:22 +0000", 
            messageDirection: "IN", 
            stage: "events-development", 
            connectedAt: 1700420961168, 
            requestTimeEpoch: 1700420962611, 
            requestId: "OqOHdHnOoAMFozw=", 
            domainName: "k10wm04op6.execute-api.us-east-1.amazonaws.com", 
            connectionId: "OqOHOcLhIAMCKcw=", 
            apiId: "k10wm04op6"
        },
        body: "{\"action\":\"subscribe\",\"topic\":\"mocktopic\"}", 
        isBase64Encoded: false
    };
};