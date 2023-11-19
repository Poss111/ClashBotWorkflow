import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyResultV2, APIGatewayProxyWebsocketEventV2 } from 'aws-lambda';
import { handler } from '../src/handler';
import { DeleteItemCommand, DeleteItemCommandInput, DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('Handle Websocket connection requests', () => {

    test('If a websocket connection reqeust is recieved, it should post the details to DynamoDb to save the state.', async () => {
        const event = createMockConnectEvent();
        const context = setupContext();

        const client = mockClient(DynamoDBClient);

        client.on(PutItemCommand)
            .resolves({});

        const expectedPutCommand: PutItemCommandInput = {
            TableName: process.env.TABLE_NAME,
            Item: {
                "connectionId": { S: event.requestContext.connectionId },
                "context": { S: "TBA" }
            }
        };
        
        const result = await handler(event, context, () => { });
        expect(result).toBeDefined();
        expect((result as any).statusCode).toBe(200);
        expect((result as any).body).toBe('{\"message\":\"Connected\"}');
        expect(client).toHaveReceivedCommandWith(PutItemCommand, expectedPutCommand);
    });

    test('If a websocket disconnect reqeust is recieved, it should post the details to DynamoDb to save the state.', async () => {
        const event = createMockDisconnectEvent();
        const context = setupContext();

        const client = mockClient(DynamoDBClient);

        client.on(DeleteItemCommand)
            .resolves({});

        const expectedDeleteCommand: DeleteItemCommandInput = {
            TableName: process.env.TABLE_NAME,
            Key: {
                "connectionId": { S: event.requestContext.connectionId }
            }
        };

        const result = await handler(event, context, () => { });
        expect(result).toBeDefined();
        expect((result as any).statusCode).toBe(200);
        expect((result as any).body).toBe('{\"message\":\"Disconnected\"}');
        expect(client).toHaveReceivedCommandWith(DeleteItemCommand, expectedDeleteCommand);
    });

    test('If a websocket message request is recieved, it should post the details to DynamoDb to save the state.', async () => {
        const event = createMockMessageEvent();
        const context = setupContext();

        const client = mockClient(DynamoDBClient);

        client.on(PutItemCommand)
            .resolves({});

        const expectedPutCommand: PutItemCommandInput = {
            TableName: process.env.TABLE_NAME,
            Item: {
                "connectionId": { S: event.requestContext.connectionId },
                "context": { S: "TBA" }
            }
        };

        const result = await handler(event, context, () => { });
        expect(result).toBeDefined();
        expect((result as any).statusCode).toBe(200);
        expect((result as any).body).toBe('{\"message\":\"Message received\"}');
        expect(client).toHaveReceivedCommandWith(PutItemCommand, expectedPutCommand);
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
            apiId: 'sampleApiId',
            domainName: 'sampleDomainName',
            requestId: 'sampleRequestId',
            routeKey: '$message',
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