import { useState, useEffect } from 'react';
import pokemonService from '../services/pokemonService';
import '../styles/PokemonForm.css';

export default function PokemonForm({ pokemon, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    pokemonId: '',
    name: '',
    image: '',
    category: 'regular',
    level: '',
    iv: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pokeSearch, setPokeSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (pokemon) {
      setFormData(pokemon);
    }
  }, [pokemon]);

  const fetchPokemonSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1000`);
      const data = await response.json();
      const filtered = data.results.filter(p => p.name.includes(query.toLowerCase())).slice(0, 10);
      setSuggestions(filtered);
    } catch {
      setSuggestions([]);
    }
  };

  const selectPokemon = async (pokemonName) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      const data = await response.json();
      const imageUrl = data.sprites.front_default || '';

      setFormData({
        ...formData,
        pokemonId: data.id,
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        image: imageUrl
      });
      setSuggestions([]);
      setPokeSearch('');
    } catch {
      setError('Failed to fetch Pokemon data');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setPokeSearch(value);
    fetchPokemonSuggestions(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (pokemon && pokemon._id) {
        await pokemonService.update(pokemon._id, formData);
      } else {
        await pokemonService.create(formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save Pokemon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pokemon-form-overlay">
      <div className="pokemon-form">
        <h2>{pokemon && pokemon._id ? 'Edit Pokemon' : 'Add Pokemon'}</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pokemonSearch">Search Pokemon</label>
            <input
              id="pokemonSearch"
              type="text"
              placeholder="Type Pokemon name..."
              value={pokeSearch}
              onChange={handleSearchChange}
            />
            {suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map(p => (
                  <li key={p.name} onClick={() => selectPokemon(p.name)}>
                    {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formData.image && (
            <div className="pokemon-image">
              <img src={formData.image} alt={formData.name} />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="regular">Regular</option>
              <option value="shiny">Shiny</option>
              <option value="xxl">XXL</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="level">Level (optional)</label>
            <input
              id="level"
              type="number"
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              min="1"
              max="50"
              placeholder="1-50"
            />
          </div>

          <div className="form-group">
            <label htmlFor="iv">IV Score (optional)</label>
            <input
              id="iv"
              type="number"
              name="iv"
              value={formData.iv}
              onChange={handleInputChange}
              min="0"
              max="100"
              placeholder="0-100"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Add any notes..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading || !formData.pokemonId}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
