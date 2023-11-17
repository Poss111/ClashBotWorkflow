import { Handler } from 'aws-lambda';
import pino from "pino";
import { DynamoDBClient, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

export const handler: Handler = async (event, context) => {
    const level = process.env.LOGGER_LEVEL === undefined ? "info" : process.env.LOGGER_LEVEL;
    const logger = pino({ level });

    logger.info({ eventRecieved: event }, 'Recieved event...');
    logger.info({ contextRecieved: context } , 'Recieved context...');

    if (event.tournament === undefined && event.tournamentDay === undefined) {
        logger.info('No tournament or tournament day provided.');
        return false;
    }

    const dynamoDBClient = new DynamoDBClient({});

    let queryConditions: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: '#type = :type',
        ExpressionAttributeNames: {
            "#type": "type"
        },
        ExpressionAttributeValues: {
            ":type": {
                S: "Tournament"
            },
        }
    };

    if (event.tournament !== undefined && event.tournamentDay !== undefined) {
        logger.info({ tournament: event.tournament, tournamentDay: event.tournamentDay }, 'Tournament and tournament day provided...');
        queryConditions = {
            ...queryConditions,
            FilterExpression: '#tournament = :tournament AND #tournamentDay = :tournamentDay',
            ExpressionAttributeNames: {
                ...queryConditions.ExpressionAttributeNames,
                "#tournament": "tournament",
                "#tournamentDay": "tournamentDay"
            },
            ExpressionAttributeValues: {
                ...queryConditions.ExpressionAttributeValues,
                ":tournament": {
                    S: event.tournament
                },
                ":tournamentDay": {
                    S: event.tournamentDay
                }
            }
        };
    } else if (event.tournament !== undefined) {
        logger.info({ tournament: event.tournament }, 'Tournament provided...')
        queryConditions = {
            ...queryConditions,
            FilterExpression: '#tournament = :tournament',
            ExpressionAttributeNames: {
                ...queryConditions.ExpressionAttributeNames,
                "#tournament": "tournament"
            },
            ExpressionAttributeValues: {
                ...queryConditions.ExpressionAttributeValues,
                ":tournament": {
                    S: event.tournament
                }
            }
        };
    }

    const queryCommand = new QueryCommand(queryConditions);

    const queryCommandOutput = await dynamoDBClient.send(queryCommand);

    if (queryCommandOutput.Items === undefined || queryCommandOutput.Items.length === 0) {
        return false;
    } else {
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); 
        const tournaments = queryCommandOutput.Items
            .map(item => unmarshall(item))
            .filter(tournament => {
                const dayOfDateOfTournament = new Date(tournament.date);
                dayOfDateOfTournament.setHours(0, 0, 0, 0);
                const tournamentIsEligible = dayOfDateOfTournament >= currentDate;
                logger.info({ ...tournament, tournamentIsEligible, currentDate }, 'Tournament eligibility...');
                return tournamentIsEligible;
            });

        return tournaments.length > 0;
    }
};