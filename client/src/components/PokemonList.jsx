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

export default function PokemonList({ onEdit, onSave, refreshKey, searchQuery = '' }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pokemonService.getAll();
      // Group entries by pokemonId
      const grouped = {};
      data.forEach((entry) => {
        const key = entry.pokemonId;
        if (!grouped[key]) {
          grouped[key] = { pokemonId: key, name: entry.name, entries: {} };
        }
        grouped[key].entries[entry.category] = entry._id;
      });
      // Sort by Pokédex number
      const sorted = Object.values(grouped).sort((a, b) => a.pokemonId - b.pokemonId);
      setRows(sorted);
    } catch {
      setError('Failed to load collection');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [refreshKey, fetchAll]);

  const handleToggle = async (row, catId) => {
    const existingId = row.entries[catId];

    if (existingId) {
      // Remove — optimistic
      setRows((prev) =>
        prev
          .map((r) => {
            if (r.pokemonId !== row.pokemonId) return r;
            const entries = { ...r.entries };
            delete entries[catId];
            return { ...r, entries };
          })
          .filter((r) => Object.keys(r.entries).length > 0)
      );
      try {
        await pokemonService.delete(existingId);
        onSave?.();
      } catch {
        fetchAll();
      }
    } else {
      // Add — optimistic
      const tempId = `temp-${Date.now()}`;
      setRows((prev) =>
        prev.map((r) =>
          r.pokemonId === row.pokemonId
            ? { ...r, entries: { ...r.entries, [catId]: tempId } }
            : r
        )
      );
      try {
        await pokemonService.create({ pokemonId: row.pokemonId, name: row.name, category: catId, notes: '' });
        onSave?.();
        fetchAll();
      } catch {
        fetchAll();
      }
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error)   return <div className="error-message">{error}</div>;
  if (rows.length === 0) return <p className="empty-message">No Pokémon in your collection yet — add some from the All Pokémon view!</p>;
  if (filtered.length === 0) return <p className="empty-message">No Pokémon match your search.</p>;

  return (
    <div className="collection-wrap">
      <table className="collection-table">
        <thead>
          <tr>
            <th className="col-name">Pokémon</th>
            {CATEGORIES.map((cat) => (
              <th key={cat.id} className={`col-cat col-${cat.id}`} title={cat.label}>
                {cat.symbol}
              </th>
            ))}
            <th className="col-action"></th>
            <th className="col-action"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.pokemonId}>
              <td className="col-name">{row.name}</td>
              {CATEGORIES.map((cat) => {
                const has = !!row.entries[cat.id];
                return (
                  <td
                    key={cat.id}
                    className={`col-cat col-${cat.id} ${has ? 'has-tag' : 'no-tag'}`}
                    onClick={() => handleToggle(row, cat.id)}
                    title={has ? `Remove ${cat.label}` : `Add ${cat.label}`}
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
