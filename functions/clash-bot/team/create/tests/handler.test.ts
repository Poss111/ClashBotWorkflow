import { handler } from '../src/handler';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { Team, TeamFromJSON } from 'clash-bot-shared';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('handler', () => {
    it('should return a status of "Done"', async () => {
        // Mock the event and context objects
        const event: Team = {
            playerDetails: {
                top: {
                    discordId: '1',
                    name: 'someUser'
                }
            },
            serverId: 'serverId',
            tournament: {
                tournamentName: 'tournamentName',
                tournamentDay: '1'
            },
        };
        const context = { /* mock context object */ };

        const dynamodbMock = mockClient(DynamoDBClient)
        dynamodbMock
            .on(PutItemCommand)
            .resolvesOnce({});

        // Call the handler function
        const result = await handler(event, context as any, {} as any);

        // Assert the result
        expect(result).toEqual({ 
            status: 'Done',
            updatedRecord: event,
            originalRecord: event
        });

        // Assert that the DynamoDBClient and PutItemCommand were called with the correct arguments
        expect(dynamodbMock).toHaveReceivedCommandWith(PutItemCommand, {
            TableName: process.env.TABLE_NAME,
            Item: {
                "type": { S: "Team" },
                "id": { S: expect.any(String) },
                "playerDetails": { S: JSON.stringify(event.playerDetails) },
                "serverId": { S: expect.any(String) },
                "tournament": { S: JSON.stringify(event.tournament) },
                "lastUpdatedAt": { S: expect.any(String) }
            }
        });
    });

    it('Should return a failed status if the event does not include player details', async () => {
        // Mock the event and context objects
        const event: Team = {
            serverId: 'serverId',
            tournament: {
                tournamentName: 'tournamentName',
                tournamentDay: '1'
            },
        };
        const context = { /* mock context object */ };

        // Call the handler function
        const result = await handler(event, context as any, {} as any);

        // Assert the result
        expect(result).toEqual({ 
            status: 'Failed',
            details: 'Player details are required to create a team.',
            originalRecord: event
        });
    });
});