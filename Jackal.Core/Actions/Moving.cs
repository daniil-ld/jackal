﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace Jackal.Core.Actions
{
    internal class Moving(TilePosition from, TilePosition to, bool withCoin = false) : IGameAction
    {
        public GameActionResult Act(Game game, Pirate pirate)
        {
            if (from == to) //нет движения
            {
                return GameActionResult.Live;
            }

            Board board = game.Board;
            Map map = game.Board.Map;

            Team ourTeam = board.Teams[pirate.TeamId];
            Ship ourShip = ourTeam.Ship;
            
            Tile targetTile = map[to.Position];
            Tile sourceTile = map[from.Position];

            if (sourceTile.Type == TileType.Airplane 
                && from != to 
                && sourceTile.Used == false)
            {
                //отмечаем, что мы использовали самолет
                sourceTile.Used = true;
            }
            
            //открываем закрытую клетку
            if (targetTile.Type == TileType.Unknown)
            {
                var newTile = board.Generator.GetNext(to.Position);
                board.Map[to.Position] = newTile;
                targetTile = newTile;

                game.LastActionTurnNo = game.TurnNo;

                if (newTile.Type.RequireImmediateMove())
                {
                    AvailableMovesTask task = new AvailableMovesTask(pirate.TeamId, to, from);
                    List<AvailableMove> targets = game.Board.GetAllAvailableMoves(task);
                    
                    if (targets.Count == 0)
                    {
                        game.KillPirate(pirate);
                        return GameActionResult.Die;
                    }

                    //мы попали в клетку, где должны сделать ещё свой выбор
                    game.NeedSubTurnPirate = pirate;
                    game.PrevSubTurnDirection = new Direction(from, to);
                }
                else if (newTile.Type == TileType.Spinning)
                {
                    to = new TilePosition(to.Position, newTile.SpinningCount - 1);
                }
                else if (newTile.Type == TileType.Cannibal)
                {
                    game.KillPirate(pirate);
                    return GameActionResult.Die;
                }
            }

            //проверяем, не попадаем ли мы на чужой корабль - тогда мы погибли
            IEnumerable<Position> enemyShips = game.Board.Teams
                .Where(x => x != ourTeam)
                .Select(x => x.Ship.Position);
            
            if (enemyShips.Contains(to.Position))
            {
                game.KillPirate(pirate);
                return GameActionResult.Die;
            }

            TileLevel fromTileLevel = map[from];
            TileLevel targetTileLevel = map[to];

            //убиваем чужих пиратов
            List<Pirate> enemyPirates = targetTileLevel.Pirates
                .Where(x => x.TeamId != pirate.TeamId)
                .ToList();
            
            foreach (var enemyPirate in enemyPirates)
            {
                Team enemyTeam = board.Teams[enemyPirate.TeamId];

                if (targetTile.Type != TileType.Water) //возвращаем врага на его корабль
                {
                    enemyPirate.Position = new TilePosition(enemyTeam.Ship.Position);
                    board.Map[enemyTeam.Ship.Position].Pirates.Add(enemyPirate);
                    targetTileLevel.Pirates.Remove(enemyPirate);
                    enemyPirate.IsInTrap = false;
                    enemyPirate.IsDrunk = false;
                    enemyPirate.DrunkSinceTurnNo = null;
                }
                else //убиваем совсем
                {
                    game.KillPirate(enemyPirate);
                }
            }
            
            if (from.Position == ourShip.Position && 
                targetTile.Type == TileType.Water &&
                Utils.Distance(from.Position, to.Position) == 1) 
            {
                //двигаем свой корабль
                var pirateOnShips = map[ourShip.Position].Pirates;
                foreach (var pirateOnShip in pirateOnShips)
                {
                    pirateOnShip.Position = to;
                    targetTileLevel.Pirates.Add(pirateOnShip);
                }
                ourShip.Position = to.Position;
                sourceTile.Pirates.Clear();
            }
            else 
            {
                //двигаем своего пирата
                fromTileLevel.Pirates.Remove(pirate);

                pirate.Position = to;
                targetTileLevel.Pirates.Add(pirate);
            }

            if (withCoin)
            {
                if (fromTileLevel.Coins == 0) 
                    throw new Exception("No coins");

                fromTileLevel.Coins--;

                if (ourTeam.Ship.Position == to.Position)  //перенос монеты на корабль
                {
                    ourShip.Coins++;

                    game.Scores[pirate.TeamId]++;
                    game.CoinsLeft--;

                    game.LastActionTurnNo = game.TurnNo;
                }
                else if (targetTile.Type == TileType.Water) // если монета попала в воду, то она тонет
                {
                    game.CoinsLeft--;
                    game.LastActionTurnNo = game.TurnNo;
                }
                else
                {
                    targetTileLevel.Coins++;
                }
            }

            //проводим пьянку для пирата
            switch (targetTile.Type)
            {
                case TileType.RumBarrel:
                    pirate.DrunkSinceTurnNo = game.TurnNo;
                    pirate.IsDrunk = true;
                    break;
                case TileType.Trap:
                    if (targetTile.Pirates.Count == 1)
                    {
                        pirate.IsInTrap = true;
                    }
                    else
                    {
                        foreach (Pirate pirateOnTile in targetTile.Pirates)
                        {
                            pirateOnTile.IsInTrap = false;
                        }
                    }
                    break;
                case TileType.Cannibal:
                    game.KillPirate(pirate);
                    return GameActionResult.Die;
            }

            return GameActionResult.Live;
        }
    }
}