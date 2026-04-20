import { useState, useEffect, useRef } from 'react';
import '../styles/PokemonGrid.css';

const ICON_URL = (name) =>
  `https://img.pokemondb.net/sprites/sword-shield/icon/${name}.png`;

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default function PokemonGrid({ trackedPokemon = [], searchQuery = '', onSelect }) {
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
    <div className="pokedex-grid">
      {filtered.map((p) => {
        const categories = trackedByPokedexId[p.id] || [];
        return (
          <div
            key={p.id}
            className={`pokedex-card ${categories.length > 0 ? 'tracked' : ''}`}
            onClick={() => onSelect(p.id, capitalize(p.name))}
            title={capitalize(p.name)}
          >
            <img
              src={ICON_URL(p.name)}
              alt={p.name}
              loading="lazy"
              onError={(e) => { e.target.style.opacity = '0.2'; }}
            />
            <span className="poke-name">{capitalize(p.name)}</span>
            {categories.length > 0 && (
              <div className="tracked-badges">
                {categories.includes('regular') && <span className="badge regular" title="Regular">●</span>}
                {categories.includes('shiny')   && <span className="badge shiny"   title="Shiny">★</span>}
                {categories.includes('xxl')     && <span className="badge xxl"     title="XXL">▲</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
