import pino from "pino";
import { EVENT_TYPE, EventPayload } from 'clash-bot-shared';
import { SQSEvent, SQSHandler } from 'aws-lambda';
import { SFNClient, StartExecutionCommand} from '@aws-sdk/client-sfn';

export const handler: SQSHandler = async (event: SQSEvent) => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });
    const eventMap = setupSFMap();
    logger.info(`Recieved ${event.Records.length} events...`);

    event.Records.forEach(record => {
        logger.info(`Processing event ${record.messageId}...`);
        const client = new SFNClient({});

        const parsedEvent = JSON.parse(record.body) as EventPayload;
        const sfArn = eventMap.get(parsedEvent.event);

        if (!sfArn) {
            logger.error(`Unmapped event found event=${parsedEvent.event}`);
            throw new Error('Failed to map event.');
        }

        client.send(new StartExecutionCommand({
            stateMachineArn: sfArn,
            name: `${parsedEvent.event}-${record.messageId}`,
            input: JSON.stringify(parsedEvent.payload),
            traceHeader: record.messageId
        }));
    });
};

function setupSFMap(): Map<EVENT_TYPE, string> {
    const eventMap: Map<EVENT_TYPE, string> = new Map();
    eventMap.set(EVENT_TYPE.CREATE_TEAM, process.env.CREATE_TEAM_SF_ARN ?? '');
    eventMap.set(EVENT_TYPE.UPDATE_TEAM, process.env.UPDATE_TEAM_SF_ARN ?? '');
    eventMap.set(EVENT_TYPE.DELETE_TEAM, process.env.DELETE_TEAM_SF_ARN ?? '');
    eventMap.set(EVENT_TYPE.CREATE_TENTATIVE_QUEUE, process.env.CREATE_TENTATIVE_QUEUE_SF_ARN ?? '');
    eventMap.set(EVENT_TYPE.UPDATE_TENTATIVE_QUEUE, process.env.UPDATE_TENTATIVE_QUEUE_SF_ARN ?? '');
    eventMap.set(EVENT_TYPE.DELETE_TENTATIVE_QUEUE, process.env.DELETE_TENTATIVE_QUEUE_SF_ARN ?? '');
    return eventMap;
};