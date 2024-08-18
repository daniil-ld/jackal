import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    CellPirate,
    FieldState,
    GameCell,
    GameMap,
    GameStartResponse,
    GameStat,
    GameState,
    PirateChanges,
    PirateChoose,
    PirateMoves,
} from './types';
import { debugLog, getAnotherRandomValue, getRandomValues } from '/app/global';
import { Constants } from '/app/constants';

export const gameSlice = createSlice({
    name: 'game',
    initialState: {
        cellSize: 50,
        pirateSize: 15,
        fields: [[]],
        lastMoves: [],
        teams: [],
        currentHumanTeam: {
            id: -1,
            activePirate: '',
            lastPirate: '',
            isHumanPlayer: true,
            group: 'girls',
        },
        highlight_x: 0,
        highlight_y: 0,
    } satisfies GameState as GameState,
    reducers: {
        initMap: (state, action: PayloadAction<GameMap>) => {
            let map = [];
            let j = 0;
            for (let i = 0; i < action.payload.height; i++) {
                let row: FieldState[] = [];
                for (let col = 0; col < action.payload.width; col++) {
                    const change = action.payload.changes[j];
                    if (!change.backgroundImageSrc) {
                        row.push({
                            backColor: change.backgroundColor,
                            levels: change.levels,
                        });
                    } else
                        row.push({
                            image: change.backgroundImageSrc,
                            levels: change.levels,
                        });
                    j++;
                }
                map.push(row);
            }
            state.fields = map;
        },
        initGame: (state, action: PayloadAction<GameStartResponse>) => {
            state.gameName = action.payload.gameName;
            state.mapId = action.payload.mapId;
            state.mapSize = action.payload.map.width;
            let index = 1;
            state.teams = action.payload.stat.teams.map((it) => ({
                id: it.id,
                activePirate: '',
                lastPirate: '',
                isHumanPlayer: it.name.includes('Human'),
                group: it.name.includes('Human')
                    ? Constants.groups[0]
                    : Constants.groups[index++] || Constants.groups[2],
            }));
            state.pirates = action.payload.pirates;
            debugLog('state.teams', state.teams);
            state.teams.forEach((team) => {
                let arr = getRandomValues(
                    Constants.PhotoMinId,
                    Constants.PhotoMaxId,
                    state.pirates?.filter((it) => it.teamId == team.id).length ?? 0,
                );
                state.pirates
                    ?.filter((it) => it.teamId == team.id)
                    .forEach((it, index) => {
                        (it.photo = `${team.group}/pirate_${arr[index]}`), (it.photoId = arr[index]);
                        it.group = team.group;
                    });
            });
            debugLog('state.pirates', state.pirates);

            const width = window.innerWidth;
            const height = window.innerHeight - 56;
            const mSize = width > height ? height : width;
            if (mSize > 560) {
                state.cellSize = Math.floor(mSize / state.mapSize / 10) * 10;
                state.pirateSize = state.cellSize * 0.5;
            }
        },
        setCurrentHumanTeam: (state, action: PayloadAction<number>) => {
            if (action.payload !== undefined && action.payload !== state.currentHumanTeam.id) {
                state.currentHumanTeam = state.teams.find((it) => it.id == action.payload)!;
            }
        },
        chooseHumanPirate: (state, action: PayloadAction<PirateChoose>) => {
            state.currentHumanTeam.activePirate = action.payload.pirate;
            state.currentHumanTeam.lastPirate = action.payload.pirate;

            if (action.payload.withCoin !== undefined) {
                state.pirates?.forEach((it) => {
                    if (it.id == state.currentHumanTeam.activePirate) {
                        it.withCoin = action.payload.withCoin;
                    }
                });
            }
            gameSlice.caseReducers.highlightHumanMoves(state, highlightHumanMoves({}));
        },
        highlightHumanMoves: (state, action: PayloadAction<PirateMoves>) => {
            console.log('highlightMoves');
            // undraw previous moves
            state.lastMoves.forEach((move) => {
                const cell = state.fields[move.to.y][move.to.x];
                cell.availableMove = undefined;
            });

            if (action.payload.moves) {
                state.lastMoves = action.payload.moves;
            }

            let hasNoMoves =
                state.lastMoves.length > 0 &&
                !state.lastMoves.some((move) => move.from.pirateIds.includes(state.currentHumanTeam.lastPirate));
            state.currentHumanTeam.activePirate = hasNoMoves
                ? state.lastMoves[0].from.pirateIds[0]
                : state.currentHumanTeam.lastPirate;

            const pirate = state.pirates?.find((it) => it.id == state.currentHumanTeam.activePirate);
            if (pirate?.position.x != state.highlight_x || pirate?.position.y != state.highlight_y) {
                const prevCell = state.fields[state.highlight_y][state.highlight_x];
                prevCell.highlight = false;
                state.highlight_x = pirate?.position.x || 0;
                state.highlight_y = pirate?.position.y || 0;
                const curCell = state.fields[state.highlight_y][state.highlight_x];
                curCell.highlight = true;
            }

            if (!pirate) return;

            // собственно подсвечиваем ходы
            state.lastMoves
                .filter(
                    (move) =>
                        move.from.pirateIds.includes(state.currentHumanTeam.activePirate) &&
                        ((pirate?.withCoin && move.withCoin) ||
                            pirate?.withCoin === undefined ||
                            (!pirate?.withCoin && !move.withCoin)),
                )
                .forEach((move) => {
                    const cell = state.fields[move.to.y][move.to.x];
                    cell.availableMove = {
                        num: move.moveNum,
                        pirate: pirate.id,
                    };
                });
        },
        applyPirateChanges: (state, action: PayloadAction<PirateChanges>) => {
            action.payload.changes.forEach((it) => {
                if (it.isAlive === false) {
                    let pirate = state.pirates!.find((pr) => pr.id === it.id)!;

                    const prevLevel = state.fields[pirate.position.y][pirate.position.x].levels[pirate.position.level];
                    if (prevLevel.pirates != undefined) {
                        let prevLevelPirate = prevLevel.pirates.find((pr) => pr.id === it.id);
                        prevLevelPirate!.photo = 'skull';
                        prevLevelPirate!.isTransparent = true;
                    }

                    state.pirates = state.pirates?.filter((pr) => pr.id !== it.id);
                } else if (it.isAlive === true) {
                    let nm = getAnotherRandomValue(
                        Constants.PhotoMinId,
                        Constants.PhotoMaxId,
                        state.pirates?.filter((pr) => pr.teamId == it.teamId).map((pr) => pr.photoId ?? 0) ?? [],
                    );
                    let teamGroup = state.teams.find((tm) => tm.id == it.teamId)!.group;
                    state.pirates?.push({
                        id: it.id,
                        teamId: it.teamId,
                        position: it.position,
                        group: teamGroup,
                        photo: `${teamGroup}/pirate_${nm}`,
                        photoId: nm,
                    });
                } else {
                    let pirate = state.pirates!.find((pr) => pr.id === it.id)!;

                    const prevLevel = state.fields[pirate.position.y][pirate.position.x].levels[pirate.position.level];
                    if (prevLevel.pirates != undefined) {
                        prevLevel.pirates = prevLevel.pirates.filter((it) => it.id != pirate.id);
                        if (prevLevel.pirates.length == 0) prevLevel.pirates = undefined;
                    }
                    pirate.position = it.position;

                    const level = state.fields[pirate.position.y][pirate.position.x].levels[pirate.position.level];
                    const drawPirate: CellPirate = {
                        id: pirate.id,
                        photo: pirate.photo,
                    };
                    if (level.pirates == undefined) level.pirates = [drawPirate];
                    else level.pirates.push(drawPirate);
                }
            });

            if (action.payload.isHumanPlayer) {
                let girls = [] as string[];
                action.payload.moves
                    .filter((move) => move.withCoin)
                    .forEach((move) => {
                        girls.push(...move.from.pirateIds);
                    });
                let girlIds = new Set(girls);
                state.pirates?.forEach((it) => {
                    it.withCoin = girlIds.has(it.id)
                        ? true //(it.withCoin ?? true)
                        : undefined;
                });
            }
        },
        applyChanges: (state, action: PayloadAction<GameCell[]>) => {
            action.payload.forEach((it) => {
                const cell = state.fields[it.y][it.x];
                if (cell.image != it.backgroundImageSrc) {
                    cell.image = it.backgroundImageSrc;
                    cell.backColor = it.backgroundColor;
                    cell.rotate = it.rotate;
                    cell.levels = it.levels;
                } else {
                    cell.levels = it.levels.map((lev) => ({
                        ...lev,
                        pirate: undefined,
                        pirates: cell.levels[lev.level].pirates,
                    }));
                }
            });
        },
        applyStat: (state, action: PayloadAction<GameStat>) => {
            state.stat = action.payload;
        },
    },
});

export const {
    initMap,
    setCurrentHumanTeam,
    chooseHumanPirate,
    highlightHumanMoves,
    applyPirateChanges,
    applyChanges,
    initGame,
    applyStat,
} = gameSlice.actions;

export default gameSlice.reducer;
