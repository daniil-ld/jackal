﻿namespace Jackal.Core.Actions
{
    public interface IGameAction
    {
        GameActionResult Act(Game game,Pirate pirate);
    }
}