import { Handler } from 'aws-lambda';
import pino, { P } from "pino";
import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Team, TeamFromJSON } from 'clash-bot-shared';

export const handler: Handler = async (event, context) => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });

    logger.info({ eventRecieved: event }, 'Recieved event...');
    logger.info({ contextRecieved: context } , 'Recieved context...');

    const dynamoDbClient = new DynamoDBClient({});

    const teamEvent = event as Team;
    
    // Define the item to add to the table
    const item: PutItemCommandInput = {
        TableName: process.env.TABLE_NAME,
        Item: {
            "type": { S: "Team" },
            "id": { S: uuidv4() },
            "playerDetails": { S: JSON.stringify(teamEvent.playerDetails) ?? '' },
            "serverId": { S: teamEvent.serverId ?? ''},
            "tournament": { S: JSON.stringify(teamEvent.tournament) ?? '' },
            "lastUpdatedAt": { S: new Date().toISOString() }
        }
    };
    
    // Create a new PutItemCommand
    const command = new PutItemCommand(item);
    await dynamoDbClient.send(command);
  
    return { 
        status: 'Done',
        updatedRecord: event,
        originalRecord: event
    };
};