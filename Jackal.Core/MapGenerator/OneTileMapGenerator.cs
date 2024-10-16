namespace Jackal.Core;

/// <summary>
/// Все клетки oneTileParams
/// </summary>
public class OneTileMapGenerator(TileParams oneTileParams, int coinsOnMap = 0) : IMapGenerator
{
    private readonly ThreeTileMapGenerator _mapGenerator = 
        new(oneTileParams, oneTileParams, oneTileParams);

    /// <summary>
    /// Идентификатор карты
    /// </summary>
    public int MapId => _mapGenerator.MapId;

    /// <summary>
    /// Монет на карте, нужно сразу рассчитать т.к. используется при инициализации Game
    /// </summary>
    public int CoinsOnMap => coinsOnMap;

    public Tile GetNext(Position position) => _mapGenerator.GetNext(position);
}