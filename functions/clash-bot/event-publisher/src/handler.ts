import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import pino from "pino";
import { SQSClient, SendMessageCommand, SendMessageCommandInput } from '@aws-sdk/client-sqs';
import { EVENT_TYPE, EventPayload } from 'clash-bot-shared';

import { APIGatewayProxyResult } from 'aws-lambda';

const eventMap: Map<String, EVENT_TYPE> = new Map();
eventMap.set('/api/v2/teams', EVENT_TYPE.CREATE_TEAM);

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });
    logger.info({ eventRecieved: event }, 'Recieved event...');
    try {
        const sqsClient = new SQSClient({});
        const mappedEventType = eventMap.get(event.requestContext.path);
        if (!mappedEventType) {
            logger.error(`Unmapped event found url=${event.requestContext.path}`);
            return {
                statusCode: 400,
                body: JSON.stringify({
                    requestId: event.requestContext.requestId,
                    error: "Unmapped url found."
                })
            };
        }
        logger.info(`Event Type for url => ${mappedEventType}...`)
        const eventToBeSent: EventPayload = { 
            payload: JSON.parse(event.body!),
            uuid: event.requestContext.requestId,
            event: mappedEventType,
            url: event.requestContext.path,
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
            body: JSON.stringify({
                requestId: event.requestContext.requestId
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                requestId: event.requestContext.requestId,
                error: "Failed to publish event."
            })
        };
    }
};