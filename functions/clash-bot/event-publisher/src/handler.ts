import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import pino from "pino";
import { SQSClient, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { EVENT_TYPE, EventPayload } from 'clash-bot-shared';

import { APIGatewayProxyResultV2 } from 'aws-lambda';

const eventMap: Map<String, EVENT_TYPE> = new Map();
eventMap.set('/api/v2/teams', EVENT_TYPE.CREATE_TEAM);

export const handler: APIGatewayProxyHandlerV2 = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2<any>> => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });
    logger.info({ eventRecieved: event }, 'Recieved event...');
    const sqsClient = new SQSClient({});
    const mappedEventType = eventMap.get(event.requestContext.http.path);
    if (!mappedEventType) {
        logger.error(`Unmapped event found url=${event.requestContext.http.path}`);
        throw new Error('Failed to map event.');
    }
    logger.info(`Event Type for url => ${mappedEventType}...`)
    const eventToBeSent: EventPayload = { 
        payload: JSON.parse(event.body!),
        uuid: event.requestContext.requestId,
        event: mappedEventType,
        url: event.requestContext.http.path,
    };
    const input: SendMessageCommandInput = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(eventToBeSent)
    };
    const message = new SendMessageCommand(input);
    const response = await sqsClient
        .send(message);
    logger.info('Sent event!', response);
    return {
        statusCode: 200,
        body: {
            requestId: event.requestContext.requestId
        }
    };
};