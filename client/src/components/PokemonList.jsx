import { useState, useEffect } from 'react';
import pokemonService from '../services/pokemonService';
import '../styles/PokemonList.css';

export default function PokemonList({ category, onEdit, refreshKey }) {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPokemon();
  }, [category, refreshKey]);

  const fetchPokemon = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await pokemonService.getAll(category);
      setPokemon(data);
    } catch (err) {
      setError('Failed to load Pokemon');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Pokemon?')) {
      try {
        await pokemonService.delete(id);
        fetchPokemon();
      } catch {
        setError('Failed to delete Pokemon');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="pokemon-list">
      {pokemon.length === 0 ? (
        <p className="empty-message">No Pokemon found in this category</p>
      ) : (
        <div className="pokemon-grid">
          {pokemon.map(p => (
            <div key={p._id} className="pokemon-card">
              {p.image && <img src={p.image} alt={p.name} />}
              <h3>{p.name}</h3>
              {p.level && <p className="detail">Level: {p.level}</p>}
              {p.iv && <p className="detail">IV: {p.iv}/100</p>}
              {p.notes && <p className="detail">Notes: {p.notes}</p>}
              <div className="card-actions">
                <button onClick={() => onEdit(p)} className="edit-btn">
                  Edit
                </button>
                <button onClick={() => handleDelete(p._id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
