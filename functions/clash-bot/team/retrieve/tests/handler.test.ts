import { handler } from '../src/handler';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { Team, TeamFromJSON } from 'clash-bot-shared';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { marshall } from '@aws-sdk/util-dynamodb';

describe('handler', () => {
    test('If filtering ctiteria is not passed, should return a list of clash bot teams', async () => {

        const listOfExcpectedTeams: Team[] = [
            {
                id: '1',
                name: 'team1',
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
                lastUpdatedAt: new Date()
            },
            {
                id: '2',
                name: 'team2',
                playerDetails: {
                    bot: {
                        discordId: '1',
                        name: 'someUser'
                    }
                },
                serverId: 'serverId',
                tournament: {
                    tournamentName: 'tournamentName',
                    tournamentDay: '1'
                },
                lastUpdatedAt: new Date()
            }
        ];

        const dynamodbMock = mockClient(DynamoDBClient);

        const items = listOfExcpectedTeams.map((team) => {
            let marshalledTeam = {
                ...team,
                lastUpdatedAt: team.lastUpdatedAt?.toISOString()
            }
            return marshall(marshalledTeam);
        });

        dynamodbMock.on(QueryCommand).resolvesOnce({
            Items: items
        });
        const results = await handler({}, {} as any, {} as any);

        expect(dynamodbMock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: 'type = :type',
            ExpressionAttributeNames: {
                "#type": "type"
            },
            ExpressionAttributeValues: {
                ":type": {
                    S: "Team"
                }
            }
        });
        expect(results).toEqual(listOfExcpectedTeams);
    });

    test('If filtering ctiteria for tournament is passed, should return a list of clash bot teams for a tournament', async () => {
        const tournamentName = 'tournamentName';
        const listOfExcpectedTeams: Team[] = [
            {
                id: '1',
                name: 'team1',
                playerDetails: {
                    top: {
                        discordId: '1',
                        name: 'someUser'
                    }
                },
                serverId: 'serverId',
                tournament: {
                    tournamentName: tournamentName,
                    tournamentDay: '1'
                },
                lastUpdatedAt: new Date()
            },
            {
                id: '2',
                name: 'team2',
                playerDetails: {
                    bot: {
                        discordId: '1',
                        name: 'someUser'
                    }
                },
                serverId: 'serverId',
                tournament: {
                    tournamentName: tournamentName,
                    tournamentDay: '1'
                },
                lastUpdatedAt: new Date()
            }
        ];

        const dynamodbMock = mockClient(DynamoDBClient);

        const items = listOfExcpectedTeams.map((team) => {
            let marshalledTeam = {
                ...team,
                lastUpdatedAt: team.lastUpdatedAt?.toISOString()
            }
            return marshall(marshalledTeam);
        });

        dynamodbMock.on(QueryCommand).resolvesOnce({
            Items: items
        });
        const results = await handler({
            tournamentName
        }, {} as any, {} as any);

        expect(dynamodbMock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: 'type = :type',
            FilterExpression: '#tournament.#tournamentName = :tournamentName',
            ExpressionAttributeNames: {
                "#type": "type",
                "#tournament": "tournament",
                "#tournamentName": "tournamentName"
            },
            ExpressionAttributeValues: {
                ":type": {
                    S: "Team"
                },
                ":tournamentName": { S: tournamentName }
            }
        });
        expect(results).toEqual(listOfExcpectedTeams);
    });

    test('If filtering ctiteria for tournament and tournament day are passed, should return a list of clash bot teams for a tournament', async () => {
        const tournamentName = 'tournamentName';
        const tournamentDay = '1';
        const listOfExcpectedTeams: Team[] = [
            {
                id: '1',
                name: 'team1',
                playerDetails: {
                    top: {
                        discordId: '1',
                        name: 'someUser'
                    }
                },
                serverId: 'serverId',
                tournament: {
                    tournamentName: tournamentName,
                    tournamentDay: tournamentDay
                },
                lastUpdatedAt: new Date()
            },
            {
                id: '2',
                name: 'team2',
                playerDetails: {
                    bot: {
                        discordId: '1',
                        name: 'someUser'
                    }
                },
                serverId: 'serverId',
                tournament: {
                    tournamentName: tournamentName,
                    tournamentDay: tournamentDay
                },
                lastUpdatedAt: new Date()
            }
        ];

        const dynamodbMock = mockClient(DynamoDBClient);

        const items = listOfExcpectedTeams.map((team) => {
            let marshalledTeam = {
                ...team,
                lastUpdatedAt: team.lastUpdatedAt?.toISOString()
            }
            return marshall(marshalledTeam);
        });

        dynamodbMock.on(QueryCommand).resolvesOnce({
            Items: items
        });
        const results = await handler({
            tournamentName,
            tournamentDay
        }, {} as any, {} as any);

        expect(dynamodbMock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: 'type = :type',
            FilterExpression: '#tournament.#tournamentName = :tournamentName AND #tournament.#tournamentDay = :tournamentDay',
            ExpressionAttributeNames: {
                "#type": "type",
                "#tournament": "tournament",
                "#tournamentName": "tournamentName",
                "#tournamentDay": "tournamentDay"
            },
            ExpressionAttributeValues: {
                ":type": {
                    S: "Team"
                },
                ":tournamentName": { S: tournamentName },
                ":tournamentDay": { S: tournamentDay }
        }});
        expect(results).toEqual(listOfExcpectedTeams);
    });

    test('If filtering ctiteria for tournament, tournament day, and server id are passed, should return a list of clash bot teams for a tournament, tournament id and server id', async () => {
        const tournamentName = 'tournamentName';
        const tournamentDay = '1';
        const serverId = 'serverId';
        const listOfExcpectedTeams: Team[] = [
            {
                id: '1',
                name: 'team1',
                playerDetails: {
                    top: {
                        discordId: '1',
                        name: 'someUser'
                    }
                },
                serverId: serverId,
                tournament: {
                    tournamentName: tournamentName,
                    tournamentDay: tournamentDay
                },
                lastUpdatedAt: new Date()
            },
            {
                id: '2',
                name: 'team2',
                playerDetails: {
                    bot: {
                        discordId: '1',
                        name: 'someUser'
                    }
                },
                serverId: serverId,
                tournament: {
                    tournamentName: tournamentName,
                    tournamentDay: tournamentDay
                },
                lastUpdatedAt: new Date()
            }
        ];

        const dynamodbMock = mockClient(DynamoDBClient);

        const items = listOfExcpectedTeams.map((team) => {
            let marshalledTeam = {
                ...team,
                lastUpdatedAt: team.lastUpdatedAt?.toISOString()
            }
            return marshall(marshalledTeam);
        });

        dynamodbMock.on(QueryCommand).resolvesOnce({
            Items: items
        });
        const results = await handler({
            tournamentName,
            tournamentDay,
            serverId
        }, {} as any, {} as any);
        expect(dynamodbMock).toHaveReceivedCommandWith(QueryCommand, {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: 'type = :type',
            FilterExpression: '#tournament.#tournamentName = :tournamentName AND #tournament.#tournamentDay = :tournamentDay AND #serverId = :serverId',
            ExpressionAttributeNames: {
                "#type": "type",
                "#tournament": "tournament",
                "#tournamentName": "tournamentName",
                "#tournamentDay": "tournamentDay",
                "#serverId": "serverId"
            },
            ExpressionAttributeValues: {
                ":type": {
                    S: "Team"
                },
                ":tournamentName": { S: tournamentName },
                ":tournamentDay": { S: tournamentDay },
                ":serverId": { S: serverId }
            }
        });
        expect(results).toEqual(listOfExcpectedTeams);
    });
});