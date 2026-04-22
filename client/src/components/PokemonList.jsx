import { useState, useEffect, useCallback } from 'react';
import pokemonService from '../services/pokemonService';
import '../styles/PokemonList.css';

const CATEGORIES = [
  { id: 'regular',      symbol: '●',  label: 'Regular'    },
  { id: 'shiny',        symbol: '★',  label: 'Shiny'      },
  { id: 'xxl',          symbol: '▲',  label: 'XXL'        },
  { id: 'hundo',        symbol: '💯', label: 'Hundo'      },
  { id: 'littleleague', symbol: 'L',  label: 'Little'     },
  { id: 'greatleague',  symbol: 'G',  label: 'Great'      },
  { id: 'ultraleague',  symbol: 'U',  label: 'Ultra'      },
  { id: 'masterleague', symbol: 'M',  label: 'Master'     },
  { id: 'dynamax',      symbol: '⬛', label: 'Dynamax'    },
  { id: 'gigantamax',   symbol: '🌀', label: 'Gigantamax' },
];

const INDICATOR = { asc: ' ▲', desc: ' ▼' };

export default function PokemonList({ onEdit, onSave, refreshKey, searchQuery = '' }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [sortCol, setSortCol] = useState(null);   // null = Pokédex #
  const [sortDir, setSortDir] = useState('asc');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pokemonService.getAll();
      const grouped = {};
      data.forEach((entry) => {
        const key = entry.pokemonId;
        if (!grouped[key]) {
          grouped[key] = { pokemonId: key, name: entry.name, entries: {} };
        }
        grouped[key].entries[entry.category] = entry._id;
      });
      // Base order is always Pokédex number; sorting is applied at render time
      const sorted = Object.values(grouped).sort((a, b) => a.pokemonId - b.pokemonId);
      setRows(sorted);
    } catch {
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [refreshKey, fetchAll]);

  const handleSort = (col) => {
    if (sortCol === col) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        // Third click — clear sort, back to Pokédex order
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const handleDeleteAll = async (row) => {
    if (!window.confirm(`Remove all tags for ${row.name}?`)) return;
    const ids = Object.values(row.entries);
    setRows((prev) => prev.filter((r) => r.pokemonId !== row.pokemonId));
    try {
      await Promise.all(ids.map((id) => pokemonService.delete(id)));
      onSave?.();
    } catch {
      fetchAll();
    }
  };

  const filtered = searchQuery.trim()
    ? rows.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : rows;

  // Apply sort; secondary sort is always Pokédex number ascending
  const displayed = [...filtered].sort((a, b) => {
    const secondary = a.pokemonId - b.pokemonId;
    if (!sortCol) return secondary;

    let primary;
    if (sortCol === 'name') {
      primary = a.name.localeCompare(b.name);
    } else {
      // Category column: asc = has tag first (1 before 0)
      const aVal = a.entries[sortCol] ? 1 : 0;
      const bVal = b.entries[sortCol] ? 1 : 0;
      primary = bVal - aVal;
    }

    if (sortDir === 'desc') primary = -primary;
    return primary !== 0 ? primary : secondary;
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error)   return <div className="error-message">{error}</div>;
  if (rows.length === 0) return <p className="empty-message">No Pokémon in your collection yet — add some from the All Pokémon view!</p>;
  if (displayed.length === 0) return <p className="empty-message">No Pokémon match your search.</p>;

  const sortTh = (col, children, className) => (
    <th
      className={`${className} sortable${sortCol === col ? ' sorted' : ''}`}
      onClick={() => handleSort(col)}
      title={`Sort by ${col}`}
    >
      {children}{sortCol === col ? INDICATOR[sortDir] : ''}
    </th>
  );

  return (
    <div className="collection-wrap">
      <table className="collection-table">
        <thead>
          <tr>
            {sortTh('name', 'Pokémon', 'col-name')}
            {CATEGORIES.map((cat) =>
              sortTh(cat.id, cat.symbol, `col-cat col-${cat.id}`)
            )}
            <th className="col-action"></th>
            <th className="col-action"></th>
          </tr>
        </thead>
        <tbody>
          {displayed.map((row) => (
            <tr key={row.pokemonId}>
              <td className="col-name">{row.name}</td>
              {CATEGORIES.map((cat) => {
                const has = !!row.entries[cat.id];
                return (
                  <td
                    key={cat.id}
                    className={`col-cat col-${cat.id} ${has ? 'has-tag' : 'no-tag'}`}
                    title={cat.label}
                  >
                    {has ? '✓' : ''}
                  </td>
                );
              })}
              <td className="col-action">
                <button
                  className="tbl-edit-btn"
                  onClick={() => onEdit({ pokemonId: row.pokemonId, name: row.name })}
                  title="Edit"
                >
                  ✏️
                </button>
              </td>
              <td className="col-action">
                <button
                  className="tbl-delete-btn"
                  onClick={() => handleDeleteAll(row)}
                  title="Delete all tags"
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
