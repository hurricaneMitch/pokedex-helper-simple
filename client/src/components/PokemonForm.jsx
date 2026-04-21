import { useState, useEffect } from 'react';
import pokemonService from '../services/pokemonService';
import '../styles/PokemonForm.css';

const SPRITE_URL = (name) =>
  `https://img.pokemondb.net/sprites/home/normal/${name.toLowerCase().replace(/ \((\w+)\)$/, (_, r) => `-${r.toLowerCase()}`).replace(/\s+/g, '-')}.png`;

const CATEGORIES = [
  { id: 'regular',     label: '● Regular'      },
  { id: 'shiny',       label: '★ Shiny'        },
  { id: 'xxl',         label: '▲ XXL'          },
  { id: 'hundo',       label: '💯 Hundo'       },
  { id: 'littleleague', label: '🏅 Little'     },
  { id: 'greatleague', label: '🥈 Great'       },
  { id: 'ultraleague', label: '🥇 Ultra'       },
  { id: 'masterleague', label: '👑 Master'     },
  { id: 'dynamax',     label: '⬛ Dynamax'    },
  { id: 'gigantamax',  label: '🌀 Gigantamax' },
];

export default function PokemonForm({ pokemon, onSave, onCancel }) {
  const isEditing = !!(pokemon && pokemon._id);

  // When editing: single category string. When adding: array of selected categories.
  const [selectedCats, setSelectedCats] = useState(
    isEditing ? [pokemon.category || 'regular'] : []
  );
  const [notes, setNotes] = useState(isEditing ? (pokemon.notes || '') : '');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setSelectedCats([pokemon.category || 'regular']);
      setNotes(pokemon.notes || '');
    }
  }, [pokemon]);

  const toggleCat = (cat) => {
    if (isEditing) {
      // Single-select when editing an existing entry
      setSelectedCats([cat]);
    } else {
      // Multi-select when adding new
      setSelectedCats((prev) =>
        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedCats.length === 0) {
      setError('Please select at least one category');
      return;
    }
    setError('');
    setLoading(true);

    const base = {
      pokemonId: pokemon.pokemonId || pokemon.id,
      name: pokemon.name,
      image: SPRITE_URL(pokemon.name),
      notes: notes || ''
    };

    try {
      if (isEditing) {
        await pokemonService.update(pokemon._id, { ...base, category: selectedCats[0] });
      } else {
        // Create one entry per selected category in parallel
        await Promise.all(
          selectedCats.map((cat) => pokemonService.create({ ...base, category: cat }))
        );
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Pokémon');
    } finally {
      setLoading(false);
    }
  };

  const saveLabel = loading
    ? 'Saving...'
    : isEditing
      ? 'Update'
      : selectedCats.length > 1
        ? `Add ${selectedCats.length} entries`
        : 'Add to Collection';

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="category-panel">
        <button className="panel-close" onClick={onCancel} aria-label="Close">×</button>

        <div className="panel-pokemon">
          <img
            src={SPRITE_URL(pokemon.name)}
            alt={pokemon.name}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2>{pokemon.name}</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{isEditing ? 'Category' : 'Categories (select all that apply)'}</label>
            <div className="category-buttons">
              {CATEGORIES.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`cat-btn cat-${id} ${selectedCats.includes(id) ? 'active' : ''}`}
                  onClick={() => toggleCat(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="save-btn"
              disabled={loading || selectedCats.length === 0}
            >
              {saveLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
