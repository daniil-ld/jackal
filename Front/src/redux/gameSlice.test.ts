import reducer, { setCurrentHumanTeam, chooseHumanPirate } from './gameSlice';
import { GameState } from './types';
import { Constants } from '/app/constants';

describe('redux logic tests', () => {
    const previousState: GameState = {
        cellSize: 50,
        pirateSize: 15,
        fields: [
            [{ levels: [{ level: 0, hasCoins: false }] }],
            [{ levels: [{ level: 0, hasCoins: false }] }],
            [{ levels: [{ level: 0, hasCoins: false }] }],
        ],
        lastMoves: [],
        pirates: [
            {
                id: '100',
                teamId: 1,
                position: {
                    level: 0,
                    x: 0,
                    y: 1,
                },
                groupId: Constants.groupIds.girls,
                photo: 'pirate_10',
                photoId: 10,
                type: Constants.pirateTypes.Base,
            },
            {
                id: '200',
                teamId: 2,
                position: {
                    level: 0,
                    x: 0,
                    y: 2,
                },
                groupId: Constants.groupIds.somali,
                photo: 'pirate_20',
                photoId: 20,
                type: Constants.pirateTypes.Base,
            },
        ],
        userSettings: {
            groups: [],
            mapSize: 11,
        },
        teams: [
            {
                id: 2,
                activePirate: '200',
                lastPirate: '200',
                isHumanPlayer: false,
                backColor: 'red',
                group: {
                    id: Constants.groupIds.somali,
                    photoMaxId: 7,
                },
            },
        ],
        currentHumanTeam: {
            id: -1,
            activePirate: '',
            lastPirate: '',
            isHumanPlayer: true,
            backColor: 'red',
            group: {
                id: Constants.groupIds.girls,
                photoMaxId: 7,
            },
        },
        highlight_x: 0,
        highlight_y: 0,
    };

    test('Устанавливаем текущую команду', () => {
        expect(reducer(previousState, setCurrentHumanTeam(2))).toEqual(
            expect.objectContaining({
                currentHumanTeam: {
                    id: 2,
                    activePirate: '200',
                    lastPirate: '200',
                    isHumanPlayer: false,
                    backColor: 'red',
                    group: {
                        id: Constants.groupIds.somali,
                        photoMaxId: 7,
                    },
                },
            }),
        );
    });

    test('Выбираем активного пирата', () => {
        expect(reducer(previousState, chooseHumanPirate({ pirate: '200', withCoinAction: true }))).toEqual(
            expect.objectContaining({
                currentHumanTeam: {
                    activePirate: '200',
                    lastPirate: '200',
                    backColor: 'red',
                    group: {
                        id: Constants.groupIds.girls,
                        photoMaxId: 7,
                    },
                    id: -1,
                    isHumanPlayer: true,
                },
                teams: [
                    {
                        activePirate: '200',
                        lastPirate: '200',
                        backColor: 'red',
                        group: {
                            id: Constants.groupIds.somali,
                            photoMaxId: 7,
                        },
                        id: 2,
                        isHumanPlayer: false,
                    },
                ],
            }),
        );
    });
});
