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
        const event = { url: '/api/v2/teams', payload: {}, event: undefined};
        const expectedEventToBeSent: EventPayload = {
            ...event,
            event: EVENT_TYPE.CREATE_TEAM
        };
        await handler(event, {});
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
        const event = { url: '/unmapped/path', payload: {}, event: undefined};
        const expectedEventToBeSent: EventPayload = {
            ...event,
            event: EVENT_TYPE.CREATE_TEAM
        };
        try {
           await handler(event, {});
           expect(true).toBeFalsy();
        } catch(err) {
            expect(err).toBeTruthy();
        }
    });
})