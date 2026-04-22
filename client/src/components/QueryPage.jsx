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

const STORAGE_KEY = 'pokedex-saved-queries';

const loadSaved = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};

// "Vulpix (Alolan)" → "vulpix"
const extractBaseName = (displayName) =>
  displayName.replace(/ \(.*\)$/, '').toLowerCase();

export default function QueryPage({ allTracked = [] }) {
  const [queryType,     setQueryType]     = useState('missing');
  const [selectedCats,  setSelectedCats]  = useState(new Set(['shiny']));
  const [regionIdx,     setRegionIdx]     = useState(0);
  const [copied,        setCopied]        = useState(false);
  const [savedQueries,  setSavedQueries]  = useState(loadSaved);
  const [saveName,      setSaveName]      = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  // ── Category toggle — always keep at least one selected ──
  const toggleCat = (catId) => {
    setSelectedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        if (next.size === 1) return prev;
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // ── Core query computation ──
  const resultIds = useMemo(() => {
    const { min, max } = REGIONS[regionIdx];

    // name → base pokemonId map (base entries only: 1–1025)
    const nameToBaseId = {};
    allTracked
      .filter(t => t.pokemonId >= 1 && t.pokemonId <= 1025)
      .forEach(t => { nameToBaseId[t.name.toLowerCase()] = t.pokemonId; });

    // Build a tracked-ID Set per selected category (regional forms always included)
    const catSets = {};
    for (const catId of selectedCats) {
      const ids = new Set();
      allTracked
        .filter(t => t.category === catId)
        .forEach(t => {
          if (t.pokemonId >= 1 && t.pokemonId <= 1025) {
            ids.add(t.pokemonId);
          } else {
            // Resolve regional form → base ID via display name
            const baseId = nameToBaseId[extractBaseName(t.name)];
            if (baseId !== undefined) ids.add(baseId);
          }
        });
      catSets[catId] = ids;
    }

    const cats = [...selectedCats];
    const result = [];
    for (let i = min; i <= max; i++) {
      const hasAny     = cats.some(c =>  catSets[c].has(i));
      const missingAny = cats.some(c => !catSets[c].has(i));
      if (queryType === 'have'    && hasAny)     result.push(i);
      if (queryType === 'missing' && missingAny) result.push(i);
    }
    return result;
  }, [allTracked, queryType, selectedCats, regionIdx]);

  const searchString = resultIds.join(',');
  const { min, max } = REGIONS[regionIdx];
  const rangeSize    = max - min + 1;

  // ── Copy ──
  const handleCopy = () => {
    navigator.clipboard.writeText(searchString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Saved queries ──
  const persistSaved = (list) => {
    setSavedQueries(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleSave = () => {
    const name = saveName.trim() || `Query ${savedQueries.length + 1}`;
    persistSaved([...savedQueries, {
      id: Date.now(),
      name,
      queryType,
      categories: [...selectedCats],
      regionIdx,
    }]);
    setSaveName('');
    setShowSaveInput(false);
  };

  const handleLoad = (q) => {
    setQueryType(q.queryType);
    setSelectedCats(new Set(q.categories));
    setRegionIdx(q.regionIdx);
  };

  const handleDeleteSaved = (id) =>
    persistSaved(savedQueries.filter(q => q.id !== id));

  const chipMeta = (q) => {
    const cats  = q.categories.map(id => CATEGORIES.find(c => c.id === id)?.label ?? id).join(', ');
    const have  = q.queryType === 'have' ? 'Have' : "Don't have";
    const region = REGIONS[q.regionIdx]?.label ?? 'All';
    return `${have} · ${region} · ${cats}`;
  };

  return (
    <div className="query-page">
      <div className="query-card">
        <h2>Query Builder</h2>
        <p className="query-subtitle">
          Build a Pokémon Go search string from your collection data.
          Paste the result directly into the in-game search bar.
        </p>

        {/* ── Query type ── */}
        <div className="query-section">
          <label className="query-label">I want Pokémon I…</label>
          <div className="query-toggle">
            <button className={queryType === 'missing' ? 'active' : ''} onClick={() => setQueryType('missing')}>
              Don't have
            </button>
            <button className={queryType === 'have' ? 'active' : ''} onClick={() => setQueryType('have')}>
              Do have
            </button>
          </div>
        </div>

        {/* ── Category — multi-select ── */}
        <div className="query-section">
          <label className="query-label">
            Category <span className="query-label-hint">select one or more</span>
          </label>
          <div className="cat-buttons">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                className={`cat-btn ${selectedCats.has(c.id) ? 'active' : ''}`}
                onClick={() => toggleCat(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Region ── */}
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

        {/* ── Result ── */}
        <div className="query-result">
          <div className="result-header">
            <span className="result-count">{resultIds.length} / {rangeSize} Pokémon</span>
            <div className="result-actions">
              {resultIds.length > 0 && (
                <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              )}
              <button className="save-query-btn" onClick={() => setShowSaveInput(v => !v)}>
                🔖 Save query
              </button>
            </div>
          </div>

          {showSaveInput && (
            <div className="save-input-row">
              <input
                type="text"
                className="save-name-input"
                placeholder="Query name (optional)…"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setShowSaveInput(false); setSaveName(''); } }}
                autoFocus
              />
              <button className="save-confirm-btn" onClick={handleSave}>Save</button>
              <button className="save-cancel-btn" onClick={() => { setShowSaveInput(false); setSaveName(''); }}>✕</button>
            </div>
          )}

          {resultIds.length === 0 ? (
            <p className="result-empty">
              {queryType === 'missing' ? 'You have them all in this range! 🎉' : 'None in your collection for this selection.'}
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

        {/* ── Saved queries ── */}
        {savedQueries.length > 0 && (
          <div className="saved-section">
            <label className="query-label">Saved Queries</label>
            <div className="saved-list">
              {savedQueries.map(q => (
                <div key={q.id} className="saved-chip">
                  <button className="saved-load" onClick={() => handleLoad(q)} title="Load this query">
                    <span className="saved-name">{q.name}</span>
                    <span className="saved-meta">{chipMeta(q)}</span>
                  </button>
                  <button className="saved-delete" onClick={() => handleDeleteSaved(q.id)} title="Delete">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
