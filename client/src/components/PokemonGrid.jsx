import { useState, useEffect, useRef } from 'react';
import '../styles/PokemonGrid.css';

const ICON_URL = (name) =>
  `https://img.pokemondb.net/sprites/sword-shield/icon/${name}.png`;

// Convert PokeAPI regional suffix to pokemondb suffix
// e.g. vulpix-alola → vulpix-alolan
const toIconName = (apiName) =>
  apiName
    .replace(/-alola$/, '-alolan')
    .replace(/-galar$/, '-galarian')
    .replace(/-hisui$/, '-hisuian')
    .replace(/-paldea$/, '-paldean');

// Nice display name for the card label and panel heading
// e.g. vulpix-alolan → Vulpix (Alolan)
const formatDisplayName = (name) => {
  const regions = [
    [/-alolan$/, ' (Alolan)'],
    [/-galarian$/, ' (Galarian)'],
    [/-hisuian$/, ' (Hisuian)'],
    [/-paldean$/, ' (Paldean)'],
  ];
  for (const [re, label] of regions) {
    if (re.test(name)) {
      const base = name.replace(re, '');
      return base.charAt(0).toUpperCase() + base.slice(1) + label;
    }
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Only include base Pokémon + the four regional variants relevant to Pokémon Go
const isRelevantPokemon = (apiName, id) => {
  if (id <= 1025) return true;
  if (id < 10001) return false;
  return /-(alola|galar|hisui|paldea)(-|$)/.test(apiName);
};

// Strip regional suffix to get the base Pokémon's API name
// e.g. vulpix-alola → vulpix, tauros-paldea-combat → tauros
const getBaseName = (apiName) =>
  apiName.replace(/-(alola|galar|hisui|paldea)(-.*)?$/, '');

// Regional forms sort directly after their base Pokémon.
// Base Pokémon use their own ID; forms use baseId + 0.5 so they slot
// in right after the base. Secondary sort by id handles multiple forms
// of the same base (e.g. three Paldean Tauros variants).
const sortKey = (p, baseIdMap) => {
  if (p.id <= 1025) return p.id;
  const baseId = baseIdMap[getBaseName(p.apiName)];
  return baseId !== undefined ? baseId + 0.5 : 9999;
};

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
        // 2000 is enough to cover all base Pokémon (1–1025) + regional forms (10001+)
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
        const data = await res.json();
        const pokemon = data.results
          .map((p) => {
            const parts = p.url.split('/').filter(Boolean);
            const id = parseInt(parts[parts.length - 1], 10);
            const iconName = toIconName(p.name);
            return { id, name: iconName, apiName: p.name };
          })
          .filter((p) => isRelevantPokemon(p.apiName, p.id));

        // Build name→id map from base Pokémon so forms can find their sort position
        const baseIdMap = {};
        pokemon.forEach((p) => { if (p.id <= 1025) baseIdMap[p.apiName] = p.id; });

        const sorted = [...pokemon].sort((a, b) => {
          const diff = sortKey(a, baseIdMap) - sortKey(b, baseIdMap);
          return diff !== 0 ? diff : a.id - b.id; // tie-break: lower id first
        });

        setAllPokemon(sorted);
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
    ? allPokemon.filter((p) =>
        p.name.includes(searchQuery.toLowerCase().trim()) ||
        p.apiName.includes(searchQuery.toLowerCase().trim())
      )
    : allPokemon;

  if (loading) return <div className="grid-loading">Loading Pokédex...</div>;
  if (error) return <div className="grid-error">{error}</div>;

  return (
    <div className={`pokedex-grid ${bulkCategory ? 'bulk-mode' : ''}`}>
      {filtered.map((p) => {
        const categories = trackedByPokedexId[p.id] || [];
        const bulkHas = bulkCategory && categories.includes(bulkCategory);
        const displayName = formatDisplayName(p.name);

        const cardClass = [
          'pokedex-card',
          categories.length > 0 ? 'tracked' : '',
          bulkCategory ? (bulkHas ? 'bulk-has' : 'bulk-target') : '',
        ].filter(Boolean).join(' ');

        // name passed to callbacks uses the pokemondb format so SPRITE_URL in
        // PokemonForm can construct the correct image URL via name.toLowerCase()
        const handleClick = () => {
          if (bulkCategory) {
            onBulkSelect(p.id, displayName);
          } else {
            onSelect(p.id, displayName);
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
                  ? `${displayName} — tap to remove`
                  : `${displayName} — tap to add`
                : displayName
            }
          >
            {bulkHas && <span className="bulk-check">✓</span>}
            <img
              src={ICON_URL(p.name)}
              alt={displayName}
              loading="lazy"
              onError={(e) => { e.target.style.opacity = '0.2'; }}
            />
            <span className="poke-name">{displayName}</span>
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
