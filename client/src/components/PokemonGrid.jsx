import { useState, useEffect, useRef } from 'react';
import '../styles/PokemonGrid.css';

const ICON_URL = (name) =>
  `https://img.pokemondb.net/sprites/sword-shield/icon/${name}.png`;

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function PokemonGrid({
  trackedPokemon = [],
  searchQuery = '',
  onSelect,
  bulkCategory = null,
  onBulkSelect,
}) {
  const [allPokemon, setAllPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchAll = async () => {
      try {
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1010');
        const data = await res.json();
        const pokemon = data.results.map((p) => {
          const parts = p.url.split('/').filter(Boolean);
          const id = parseInt(parts[parts.length - 1], 10);
          return { id, name: p.name };
        });
        setAllPokemon(pokemon);
      } catch {
        setError('Failed to load Pokémon list');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const trackedByPokedexId = trackedPokemon.reduce((acc, t) => {
    if (!acc[t.pokemonId]) acc[t.pokemonId] = [];
    acc[t.pokemonId].push(t.category);
    return acc;
  }, {});

  const filtered = searchQuery.trim()
    ? allPokemon.filter((p) => p.name.includes(searchQuery.toLowerCase().trim()))
    : allPokemon;

  if (loading) return <div className="grid-loading">Loading Pokédex...</div>;
  if (error) return <div className="grid-error">{error}</div>;

  return (
    <div className={`pokedex-grid ${bulkCategory ? 'bulk-mode' : ''}`}>
      {filtered.map((p) => {
        const categories = trackedByPokedexId[p.id] || [];
        const bulkHas = bulkCategory && categories.includes(bulkCategory);

        const cardClass = [
          'pokedex-card',
          categories.length > 0 ? 'tracked' : '',
          bulkCategory ? (bulkHas ? 'bulk-has' : 'bulk-target') : '',
        ].filter(Boolean).join(' ');

        const handleClick = () => {
          if (bulkCategory) {
            onBulkSelect(p.id, capitalize(p.name));
          } else {
            onSelect(p.id, capitalize(p.name));
          }
        };

        return (
          <div
            key={p.id}
            className={cardClass}
            onClick={handleClick}
            title={
              bulkCategory
                ? bulkHas
                  ? `${capitalize(p.name)} — tap to remove`
                  : `${capitalize(p.name)} — tap to add`
                : capitalize(p.name)
            }
          >
            {bulkHas && <span className="bulk-check">✓</span>}
            <img
              src={ICON_URL(p.name)}
              alt={p.name}
              loading="lazy"
              onError={(e) => { e.target.style.opacity = '0.2'; }}
            />
            <span className="poke-name">{capitalize(p.name)}</span>
            {categories.length > 0 && (
              <div className="tracked-badges">
                {categories.includes('regular')      && <span className="badge regular"      title="Regular">●</span>}
                {categories.includes('shiny')        && <span className="badge shiny"        title="Shiny">★</span>}
                {categories.includes('xxl')          && <span className="badge xxl"          title="XXL">▲</span>}
                {categories.includes('hundo')        && <span className="badge hundo"        title="Hundo">💯</span>}
                {categories.includes('littleleague') && <span className="badge littleleague" title="Little League">L</span>}
                {categories.includes('greatleague')  && <span className="badge greatleague"  title="Great League">G</span>}
                {categories.includes('ultraleague')  && <span className="badge ultraleague"  title="Ultra League">U</span>}
                {categories.includes('masterleague') && <span className="badge masterleague" title="Master League">M</span>}
                {categories.includes('dynamax')      && <span className="badge dynamax"      title="Dynamax">D</span>}
                {categories.includes('gigantamax')   && <span className="badge gigantamax"   title="Gigantamax">GX</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
