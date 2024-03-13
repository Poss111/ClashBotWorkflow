import { handler } from '../src/handler';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { marshall } from '@aws-sdk/util-dynamodb';
import { TABLE_TYPES } from 'clash-bot-shared';

describe('handler', () => {
    test('If the tournament is after the current date, then respond with true', async () => {
        const tournamentName = 'Clash Tournament';
        const date = new Date();
        date.setHours(1, 0, 0, 0);
        const mock = mockClient(DynamoDBClient);
        const mockQueryCommand = jest.fn();
        mockQueryCommand.mockResolvedValue({
            Items: [
                marshall({
                    type: TABLE_TYPES.TOURNAMENT,
                    tournament: tournamentName,
                    date: date.toISOString()
                })
            ]
        });
        mock.on(QueryCommand).resolves(mockQueryCommand());

        const result = await handler({
            tournament: tournamentName
        }, {} as any, {} as any);

        expect(result).toEqual({
            isEligible: true
        });
        expect(mock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: '#type = :type',
            FilterExpression: '#tournament = :tournament',
            ExpressionAttributeNames: {
                '#type': 'type',
                '#tournament': 'tournament'
            },
            ExpressionAttributeValues: {
                ':type': { S: TABLE_TYPES.TOURNAMENT, },
                ':tournament': { S: tournamentName }
            }
        });
    });

    test('If the tournament and tournament day are passed and is after the current date, then respond with true', async () => {
        const tournamentName = 'Clash Tournament';
        const tournamentDay = '1';
        const date = new Date();
        date.setHours(1, 0, 0, 0);
        const mock = mockClient(DynamoDBClient);
        const mockQueryCommand = jest.fn();
        mockQueryCommand.mockResolvedValue({
            Items: [
                marshall({
                    type: TABLE_TYPES.TOURNAMENT,
                    tournament: tournamentName,
                    tournamentDay,
                    date: date.toISOString()
                })
            ]
        });
        mock.on(QueryCommand).resolves(mockQueryCommand());

        const result = await handler({
            tournament: tournamentName,
            tournamentDay
        }, {} as any, {} as any);

        expect(result).toEqual({
            isEligible: true
        });
        expect(mock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: '#type = :type',
            FilterExpression: '#tournament = :tournament AND #tournamentDay = :tournamentDay',
            ExpressionAttributeNames: {
                '#type': 'type',
                '#tournament': 'tournament',
                '#tournamentDay': 'tournamentDay'
            },
            ExpressionAttributeValues: {
                ':type': { S: TABLE_TYPES.TOURNAMENT },
                ':tournament': { S: tournamentName },
                ':tournamentDay': { S: tournamentDay }
            }
        });
    });

    test('If multiple days are returned, check both days', async () => {
        const tournamentName = 'Clash Tournament';
        const tournamentDay = '1';
        const date = new Date();
        date.setHours(1, 0, 0, 0);
        const priorDate = new Date();
        priorDate.setHours(-1, 0, 0, 0);
        const mock = mockClient(DynamoDBClient);
        const mockQueryCommand = jest.fn();
        mockQueryCommand.mockResolvedValue({
            Items: [
                marshall({
                    type: TABLE_TYPES.TOURNAMENT,
                    tournament: tournamentName,
                    tournamentDay,
                    date: priorDate.toISOString()
                }),
                marshall({
                    type: TABLE_TYPES.TOURNAMENT,
                    tournament: tournamentName,
                    tournamentDay: '2',
                    date: date.toISOString()
                })
            ]
        });
        mock.on(QueryCommand).resolves(mockQueryCommand());

        const result = await handler({
            tournament: tournamentName,
            tournamentDay
        }, {} as any, {} as any);

        expect(result).toEqual({
            isEligible: true
        });
        expect(mock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: '#type = :type',
            FilterExpression: '#tournament = :tournament AND #tournamentDay = :tournamentDay',
            ExpressionAttributeNames: {
                '#type': 'type',
                '#tournament': 'tournament',
                '#tournamentDay': 'tournamentDay'
            },
            ExpressionAttributeValues: {
                ':type': { S: TABLE_TYPES.TOURNAMENT },
                ':tournament': { S: tournamentName },
                ':tournamentDay': { S: tournamentDay }
            }
        });
    });
});