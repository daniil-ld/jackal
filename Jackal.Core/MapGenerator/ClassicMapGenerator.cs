﻿using System;
using System.Collections.Generic;
using System.Linq;

namespace Jackal.Core
{
    public class ClassicMapGenerator : IMapGenerator
    {
        public int MapId { get; }
        private readonly Random _rand;
        private readonly Dictionary<Position,Tile> _tiles;
        
        public int CoinsOnMap { get; }

        public ClassicMapGenerator(int mapId, int mapSize)
        {
            MapId = mapId;
            _rand = new Random(MapId + 5000000);

            var tilesPack = new ClassicTilesPack(_rand, mapSize);
            CoinsOnMap = tilesPack.CoinsOnMap;
            
            var pack = Shuffle(tilesPack.List);
            var positions = GetAllEarth(mapSize).ToList();

            if (pack.Count != positions.Count)
                throw new Exception("Wrong tiles pack count");

            _tiles = new Dictionary<Position, Tile>();

            foreach (var info in pack.Zip(positions, (def, position) => new {Def = def, Position = position}))
            {
                var tempDef = info.Def.Clone();
                if (tempDef.Type != TileType.Spinning && 
                    tempDef.Type != TileType.Caramba &&
                    tempDef.Type != TileType.Chest1 &&
                    tempDef.Type != TileType.Chest2 &&
                    tempDef.Type != TileType.Chest3 &&
                    tempDef.Type != TileType.Chest4 &&
                    tempDef.Type != TileType.Chest5 &&
                    tempDef.Type != TileType.Ice)
                {
                    // клетки не указанные в условии - вращаем при отображении на карте
                    tempDef.Direction = _rand.Next(4);
                }
                
                if (tempDef.Type is TileType.Arrow)
                {
                    for (var j = 1; j <= tempDef.Direction; j++)
                    {
                        tempDef.ArrowsCode = ArrowsCodesHelper.DoRotate(tempDef.ArrowsCode);
                    }
                }

                tempDef.Position = info.Position;
                
                var tile = new Tile(tempDef);
                tile.Levels[0].Coins = tile.Type.CoinsCount();
                
                _tiles.Add(info.Position, tile);
            }
        }

        private List<TileParams> Shuffle(IEnumerable<TileParams> defs)
        {
            return defs
                .Select(x => new {Def = x, Number = _rand.NextDouble()})
                .OrderBy(x => x.Number)
                .Select(x => x.Def)
                .ToList();
        }

        private static IEnumerable<Position> GetAllEarth(int mapSize)
        {
            for (int x = 1; x <= mapSize - 2; x++)
            {
                for (int y = 1; y <= mapSize - 2; y++)
                {
                    Position val = new Position(x, y);
                    if (Utils.InCorners(val, 1, mapSize - 2) == false)
                    {
                        yield return val;
                    }
                }
            }
        }
        
        public Tile GetNext(Position position)
        {
            return _tiles[position];
        }
    }
}