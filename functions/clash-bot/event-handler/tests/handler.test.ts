import { handler } from '../src/handler';
import { SQSEvent } from 'aws-lambda';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { EVENT_TYPE } from 'clash-bot-shared';
import { EventPayload } from 'clash-bot-shared';

describe('Should invoke a AWS Step function based on the event.', () => {

    describe('Should invoke a AWS Step function based on the event.', () => {

        beforeEach(() => {
            process.env.CREATE_TEAM_SF_ARN = 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine';
            process.env.UPDATE_TEAM_SF_ARN = 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-2';
            process.env.DELETE_TEAM_SF_ARN = 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-3';
            process.env.CREATE_TENTATIVE_QUEUE_SF_ARN = 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-4';
            process.env.UPDATE_TENTATIVE_QUEUE_SF_ARN = 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-5';
            process.env.DELETE_TENTATIVE_QUEUE_SF_ARN = 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-6';
        });

        const inputs = [
            {
                event: EVENT_TYPE.CREATE_TEAM,
                arn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine',
            }, 
            {
                event: EVENT_TYPE.UPDATE_TEAM,
                arn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-2',
            },
            {
                event: EVENT_TYPE.DELETE_TEAM,
                arn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-3',
            },
            {
                event: EVENT_TYPE.CREATE_TENTATIVE_QUEUE,
                arn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-4',
            },
            {
                event: EVENT_TYPE.UPDATE_TENTATIVE_QUEUE,
                arn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-5',
            },
            {
                event: EVENT_TYPE.DELETE_TENTATIVE_QUEUE,
                arn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-6',
            }
        ];

        test.each(inputs)('event - %s - Should publish an event to the mapped step function', async (eventEntry) => {
            const sfnMock = mockClient(SFNClient)
            sfnMock
                .on(StartExecutionCommand)
                .resolvesOnce({});
            const event: EventPayload = { 
                url: '/api/v2/teams', 
                payload: {
                    mock: 'mock'
                }, 
                event: eventEntry.event,
                uuid: '1234'
            };
            const sqsEvent: SQSEvent = {
                Records: [
                    {
                        messageId: '123',
                        receiptHandle: 'abc',
                        body: JSON.stringify(event),
                        attributes: {
                            ApproximateReceiveCount: '1',
                            SentTimestamp: '123456789',
                            SenderId: 'test-sender',
                            ApproximateFirstReceiveTimestamp: '123456789'
                        },
                        messageAttributes: {},
                        md5OfBody: '',
                        eventSource: '',
                        eventSourceARN: '',
                        awsRegion: '',
                    },
                ]
            };
            await handler(sqsEvent, {} as any, {} as any);
            await expect(sfnMock).toHaveReceivedCommandWith(StartExecutionCommand, {
                stateMachineArn: eventEntry.arn,
                name: `${eventEntry.event}-${sqsEvent.Records[0].messageId}`,
                input: JSON.stringify(event.payload),
                traceHeader: sqsEvent.Records[0].messageId
            });
        });

        test('Should trigger multiple step functions based on an event', async () => {
            const sfnMock = mockClient(SFNClient)
            sfnMock
                .on(StartExecutionCommand)
                .resolvesOnce({});
            const createTeamEvent: EventPayload = { 
                url: '/api/v2/teams', 
                payload: {
                    mock: 'mock'
                }, 
                event: EVENT_TYPE.CREATE_TEAM,
                uuid: '1234'
            };
            const updateTeamEvent: EventPayload = { 
                url: '/api/v2/teams', 
                payload: {
                    mock: 'mock'
                }, 
                event: EVENT_TYPE.UPDATE_TEAM,
                uuid: '1234'
            };
            const sqsEvent: SQSEvent = {
                Records: [
                    {
                        messageId: '123',
                        receiptHandle: 'abc',
                        body: JSON.stringify(createTeamEvent),
                        attributes: {
                            ApproximateReceiveCount: '1',
                            SentTimestamp: '123456789',
                            SenderId: 'test-sender',
                            ApproximateFirstReceiveTimestamp: '123456789'
                        },
                        messageAttributes: {},
                        md5OfBody: '',
                        eventSource: '',
                        eventSourceARN: '',
                        awsRegion: '',
                    },
                    {
                        messageId: '456',
                        receiptHandle: 'def',
                        body: JSON.stringify(updateTeamEvent),
                        attributes: {
                            ApproximateReceiveCount: '1',
                            SentTimestamp: '123456789',
                            SenderId: 'test-sender',
                            ApproximateFirstReceiveTimestamp: '123456789'
                        },
                        messageAttributes: {},
                        md5OfBody: '',
                        eventSource: '',
                        eventSourceARN: '',
                        awsRegion: '',
                    }
                ]
            };
            await handler(sqsEvent, {} as any, {} as any);
            await expect(sfnMock).toHaveReceivedCommandWith(StartExecutionCommand, {
                stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine',
                name: `${createTeamEvent.event}-${sqsEvent.Records[0].messageId}`,
                input: JSON.stringify(createTeamEvent.payload),
                traceHeader: sqsEvent.Records[0].messageId
            });
            await expect(sfnMock).toHaveReceivedCommandWith(StartExecutionCommand, {
                stateMachineArn: 'arn:aws:states:us-east-1:123456789012:stateMachine:HelloWorld-StateMachine-2',
                name: `${updateTeamEvent.event}-${sqsEvent.Records[1].messageId}`,
                input: JSON.stringify(updateTeamEvent.payload),
                traceHeader: sqsEvent.Records[1].messageId
            });
        });
    });

    test('Error - If an event recieved does not have a mapped Step Function, then a error should be thrown', async () => {
        const sfnMock = mockClient(SFNClient)
        sfnMock
            .on(StartExecutionCommand)
            .resolvesOnce({});
        const event: EventPayload = { 
            url: '/api/v2/teams', 
            payload: {}, 
            event: EVENT_TYPE.CREATE_TEAM,
            uuid: '1234'
        };
        const sqsEvent: SQSEvent = {
            Records: [
                {
                    messageId: '123',
                    receiptHandle: 'abc',
                    body: JSON.stringify(event),
                    attributes: {
                        ApproximateReceiveCount: '1',
                        SentTimestamp: '123456789',
                        SenderId: 'test-sender',
                        ApproximateFirstReceiveTimestamp: '123456789'
                    },
                    messageAttributes: {},
                    md5OfBody: '',
                    eventSource: '',
                    eventSourceARN: '',
                    awsRegion: '',
                },
            ]
        };
        try {
           await handler(sqsEvent, {} as any, {} as any);
           expect(true).toBeFalsy();
        } catch(err) {
            expect(err).toBeTruthy();
        }
    });
})