import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from '../src/handler';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { EVENT_TYPE } from 'clash-bot-shared';
import { EventPayload } from 'clash-bot-shared';

describe('Publish an event to SQS with an event type.', () => {

    beforeEach(() => {
        process.env.QUEUE_URL = '1234-i-am-a-queue';
    });

    test('Should publish an event to an SQS', async () => {
        const snsMock = mockClient(SQSClient)
        snsMock
            .on(SendMessageCommand)
            .resolvesOnce({});
        const bodyOfRequest = {
            details: {}
        };
        const eventTwo: APIGatewayProxyEventV2 = {
            requestContext: {
                requestId: '1234',
                accountId: '',
                apiId: '',
                domainName: '',
                domainPrefix: '',
                http: {
                    method: 'POST',
                    path: '/api/v2/teams',
                    protocol: 'HTTPS',
                    sourceIp: '1.2.3.4',
                    userAgent: 'chrome'
                },
                routeKey: '',
                stage: '',
                time: '',
                timeEpoch: 0
            },
            body: JSON.stringify(bodyOfRequest),
            version: '',
            routeKey: '',
            rawPath: '/api/v2/teams',
            rawQueryString: '',
            headers: { },
            isBase64Encoded: false
        };
        const expectedEventToBeSent: EventPayload = {
            payload: bodyOfRequest,
            uuid: eventTwo.requestContext.requestId,
            event: EVENT_TYPE.CREATE_TEAM,
            url: eventTwo.requestContext.http.path,
        };
        await handler(eventTwo, setupContext(), {} as any);
        await expect(snsMock).toHaveReceivedCommandWith(SendMessageCommand, {
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(expectedEventToBeSent)
        });
    });

    test('Error - If event url is unmapped, then it should throw an exception', async () => {
        const snsMock = mockClient(SQSClient)
        snsMock
            .on(SendMessageCommand)
            .resolvesOnce({});
            const bodyOfRequest = {
                details: {}
            };
            const eventTwo: APIGatewayProxyEventV2 = {
                requestContext: {
                    requestId: '1234',
                    accountId: '',
                    apiId: '',
                    domainName: '',
                    domainPrefix: '',
                    http: {
                        method: 'POST',
                        path: '/unmapped-url',
                        protocol: 'HTTPS',
                        sourceIp: '1.2.3.4',
                        userAgent: 'chrome'
                    },
                    routeKey: '',
                    stage: '',
                    time: '',
                    timeEpoch: 0
                },
                body: JSON.stringify(bodyOfRequest),
                version: '',
                routeKey: '',
                rawPath: '/unmapped-url',
                rawQueryString: '',
                headers: { },
                isBase64Encoded: false
            };
        try {
           await handler(eventTwo, setupContext(), {} as any);
           expect(true).toBeFalsy();
        } catch(err) {
            expect(err).toBeTruthy();
        }
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