import { useState, useMemo } from 'react';
import '../styles/QueryPage.css';

const CATEGORIES = [
  { id: 'regular',      label: '● Regular'     },
  { id: 'shiny',        label: '★ Shiny'       },
  { id: 'xxl',          label: '▲ XXL'         },
  { id: 'hundo',        label: '💯 Hundo'      },
  { id: 'littleleague', label: 'L Little League'},
  { id: 'greatleague',  label: 'G Great League' },
  { id: 'ultraleague',  label: 'U Ultra League' },
  { id: 'masterleague', label: 'M Master League'},
  { id: 'dynamax',      label: '⬛ Dynamax'    },
  { id: 'gigantamax',   label: '🌀 Gigantamax' },
];

const REGIONS = [
  { label: 'All',    min: 1,   max: 1025 },
  { label: 'Kanto',  min: 1,   max: 151  },
  { label: 'Johto',  min: 152, max: 251  },
  { label: 'Hoenn',  min: 252, max: 386  },
  { label: 'Sinnoh', min: 387, max: 493  },
  { label: 'Unova',  min: 494, max: 649  },
  { label: 'Kalos',  min: 650, max: 721  },
  { label: 'Alola',  min: 722, max: 809  },
  { label: 'Galar',  min: 810, max: 905  },
  { label: 'Paldea', min: 906, max: 1025 },
];

export default function QueryPage({ allTracked = [] }) {
  const [queryType, setQueryType] = useState('missing');
  const [category,  setCategory]  = useState('shiny');
  const [regionIdx, setRegionIdx] = useState(0);
  const [copied,    setCopied]    = useState(false);

  const resultIds = useMemo(() => {
    const { min, max } = REGIONS[regionIdx];

    // Set of base Pokédex IDs (1–1025) the user has for this category
    const trackedIds = new Set(
      allTracked
        .filter(t => t.category === category && t.pokemonId >= 1 && t.pokemonId <= 1025)
        .map(t => t.pokemonId)
    );

    const ids = [];
    for (let i = min; i <= max; i++) {
      const has = trackedIds.has(i);
      if (queryType === 'missing' && !has) ids.push(i);
      if (queryType === 'have'    &&  has) ids.push(i);
    }
    return ids;
  }, [allTracked, queryType, category, regionIdx]);

  const searchString = resultIds.map(id => `${id}`).join(',');

  const handleCopy = () => {
    navigator.clipboard.writeText(searchString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const { min, max } = REGIONS[regionIdx];
  const rangeSize = max - min + 1;

  return (
    <div className="query-page">
      <div className="query-card">
        <h2>Query Builder</h2>
        <p className="query-subtitle">
          Build a Pokémon Go search string from your collection data.
          Paste the result directly into the in-game search bar.
        </p>

        {/* Query type */}
        <div className="query-section">
          <label className="query-label">I want Pokémon I…</label>
          <div className="query-toggle">
            <button
              className={queryType === 'missing' ? 'active' : ''}
              onClick={() => setQueryType('missing')}
            >
              Don't have
            </button>
            <button
              className={queryType === 'have' ? 'active' : ''}
              onClick={() => setQueryType('have')}
            >
              Do have
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="query-section">
          <label className="query-label">Category</label>
          <div className="cat-buttons">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`cat-btn ${category === c.id ? 'active' : ''}`}
                onClick={() => setCategory(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div className="query-section">
          <label className="query-label">Region</label>
          <div className="gen-buttons">
            {REGIONS.map((r, i) => (
              <button
                key={r.label}
                className={regionIdx === i ? 'active' : ''}
                onClick={() => setRegionIdx(i)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <span className="gen-range-hint">{min}–{max} ({rangeSize} Pokémon)</span>
        </div>

        {/* Result */}
        <div className="query-result">
          <div className="result-header">
            <span className="result-count">
              {resultIds.length} / {rangeSize} Pokémon
            </span>
            {resultIds.length > 0 && (
              <button
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
              >
                {copied ? '✓ Copied!' : 'Copy to clipboard'}
              </button>
            )}
          </div>

          {resultIds.length === 0 ? (
            <p className="result-empty">
              {queryType === 'missing'
                ? "You have them all in this range! 🎉"
                : "None in your collection for this selection."}
            </p>
          ) : (
            <textarea
              className="result-string"
              readOnly
              value={searchString}
              rows={5}
              onClick={e => e.target.select()}
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}
