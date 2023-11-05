"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const pino_1 = __importDefault(require("pino"));
const client_sqs_1 = require("@aws-sdk/client-sqs");
const event_types_1 = require("./interfaces/event-types");
const eventMap = new Map();
eventMap.set('/some/path', event_types_1.EVENT_TYPE.CREATE_TEAM);
const handler = async (event, context) => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = (0, pino_1.default)({ level });
    logger.info({ eventRecieved: event }, 'Recieved event...');
    const sqsClient = new client_sqs_1.SQSClient({});
    const eventToBeSent = { ...event };
    const mappedEventType = eventMap.get(event.url);
    if (!mappedEventType) {
        logger.error(`Event is unable to be mapped => ${event.url}`);
        throw new Error('Failed to map event.');
    }
    logger.info(`Event Type for url => ${mappedEventType}...`);
    eventToBeSent.event = mappedEventType;
    const input = {
        QueueUrl: process.env.QUEUE_URL,
        MessageBody: JSON.stringify(eventToBeSent)
    };
    const message = new client_sqs_1.SendMessageCommand(input);
    const response = await sqsClient
        .send(message);
    logger.info('Sent event!', response);
    return response;
};
exports.handler = handler;
