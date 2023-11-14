import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
        const eventTwo: APIGatewayProxyEvent = createEvent(
            "/api/v2/teams",
            "POST",
            bodyOfRequest
        );
        const expectedEventToBeSent: EventPayload = {
            payload: bodyOfRequest,
            uuid: eventTwo.requestContext.requestId,
            event: EVENT_TYPE.CREATE_TEAM,
            url: eventTwo.requestContext.path,
        };
        await handler(eventTwo, setupContext(), {} as any);
        await expect(snsMock).toHaveReceivedCommandWith(SendMessageCommand, {
            QueueUrl: process.env.QUEUE_URL,
            MessageBody: JSON.stringify(expectedEventToBeSent),
            MessageGroupId: 'event',
            MessageDeduplicationId: eventTwo.requestContext.requestId
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
        const eventTwo: APIGatewayProxyEvent = createEvent(
            "/unmapped-url",
            "POST",
            bodyOfRequest
        );
        const response = await handler(eventTwo, setupContext(), {} as any);
        expect((response as APIGatewayProxyResult).statusCode).toBe(400);
    });

    test('Error - If an exception occurs within the function, it should be wrapped and returned.', async () => {
        const snsMock = mockClient(SQSClient)
        snsMock
            .on(SendMessageCommand)
            .rejects({});
        const bodyOfRequest = {
            details: {}
        };
        const eventTwo: APIGatewayProxyEvent = createEvent(
            "/api/v2/teams",
            "POST",
            bodyOfRequest
        );
        const response = await handler(eventTwo, setupContext(), {} as any);
        expect((response as APIGatewayProxyResult).statusCode).toBe(500);
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

const createEvent = (path: string, method: string, body: any): APIGatewayProxyEvent => {
    return {
        version: "1.0",
        resource: "$default",
        path: path,
        httpMethod: method,
        headers: {
            "Content-Length": "0",
            "Host": "w6261upn4d.execute-api.us-east-1.amazonaws.com",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "X-Amzn-Trace-Id": "Root=1-6552a68d-2e15b45760fc05a821f7a36f",
            "X-Forwarded-For": "75.44.66.126",
            "X-Forwarded-Port": "443",
            "X-Forwarded-Proto": "https",
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "max-age=0",
            "sec-ch-ua": "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1"
        },
        multiValueHeaders: {
            "Content-Length": [
                "0"
            ],
            "Host": [
                "w6261upn4d.execute-api.us-east-1.amazonaws.com"
            ],
            "User-Agent": [
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            ],
            "X-Amzn-Trace-Id": [
                "Root=1-6552a68d-2e15b45760fc05a821f7a36f"
            ],
            "X-Forwarded-For": [
                "75.44.66.126"
            ],
            "X-Forwarded-Port": [
                "443"
            ],
            "X-Forwarded-Proto": [
                "https"
            ],
            "accept": [
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
            ],
            "accept-encoding": [
                "gzip, deflate, br"
            ],
            "accept-language": [
                "en-US,en;q=0.9"
            ],
            "cache-control": [
                "max-age=0"
            ],
            "sec-ch-ua": [
                "\"Google Chrome\";v=\"119\", \"Chromium\";v=\"119\", \"Not?A_Brand\";v=\"24\""
            ],
            "sec-ch-ua-mobile": [
                "?0"
            ],
            "sec-ch-ua-platform": [
                "\"macOS\""
            ],
            "sec-fetch-dest": [
                "document"
            ],
            "sec-fetch-mode": [
                "navigate"
            ],
            "sec-fetch-site": [
                "none"
            ],
            "sec-fetch-user": [
                "?1"
            ],
            "upgrade-insecure-requests": [
                "1"
            ]
        },
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        requestContext: {
            accountId: "816923827429",
            apiId: "w6261upn4d",
            domainName: "w6261upn4d.execute-api.us-east-1.amazonaws.com",
            domainPrefix: "w6261upn4d",
            extendedRequestId: "OW72OiN2IAMEJCQ=",
            httpMethod: method,
            identity: {
                accessKey: null,
                accountId: null,
                caller: null,
                cognitoAmr: "null",
                cognitoAuthenticationProvider: null,
                cognitoAuthenticationType: null,
                cognitoIdentityId: null,
                cognitoIdentityPoolId: null,
                principalOrgId: null,
                sourceIp: "75.44.66.126",
                user: null,
                userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                userArn: null
            } as any,
            path: path,
            protocol: "HTTP/1.1",
            requestId: "OW72OiN2IAMEJCQ=",
            requestTime: "13/Nov/2023:22:43:25 +0000",
            requestTimeEpoch: 1699915405999,
            resourceId: "$default",
            resourcePath: "$default",
            stage: "$default"
        } as any,
        pathParameters: null,
        stageVariables: null,
        body: JSON.stringify(body),
        isBase64Encoded: false
    } as any;
}