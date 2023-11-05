import { Handler } from 'aws-lambda';
import pino from "pino";
import { SQSClient, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { EVENT_TYPE } from 'clash-bot-shared';

const eventMap: Map<String, EVENT_TYPE> = new Map();
eventMap.set('/api/v2/teams', EVENT_TYPE.CREATE_TEAM);

export const handler = async (event: any, context: any) => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });
    logger.info({ eventRecieved: event }, 'Recieved event...');
    const sqsClient = new SQSClient({});
    const eventToBeSent = { ...event };
    const mappedEventType = eventMap.get(event.url);
    if (!mappedEventType) {
        logger.error(`Unmapped event found url=${event.url}`);
        throw new Error('Failed to map event.');
    }
    logger.info(`Event Type for url => ${mappedEventType}...`)
    eventToBeSent.event = mappedEventType;
    const input: SendMessageCommandInput = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(eventToBeSent)
    };
    const message = new SendMessageCommand(input);
    const response = await sqsClient
        .send(message);
    logger.info('Sent event!', response);
    return response;
};