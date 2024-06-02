﻿using System;

namespace Jackal.Core
{
    public class GameState
    {
        public Guid GameId;
        public Board Board;
        public Move[] AvailableMoves;
        public int TeamId;
        public int TurnNumber;
        public int SubTurnNumber;
    }
}