import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import pokemonService from '../services/pokemonService';
import PokemonForm from './PokemonForm';
import PokemonList from './PokemonList';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('regular');
  const [showForm, setShowForm] = useState(false);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [stats, setStats] = useState({ shiny: 0, regular: 0, xxl: 0 });
  const [refreshKey, setRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    try {
      const data = await pokemonService.getStats();
      setStats(data);
    } catch {
      console.error('Failed to fetch stats');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleAddPokemon = () => {
    setSelectedPokemon(null);
    setShowForm(true);
  };

  const handleEditPokemon = (pokemon) => {
    setSelectedPokemon(pokemon);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setSelectedPokemon(null);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Pokemon Go Tracker</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="stats-container">
        <div className="stat-box">
          <h3>Regular</h3>
          <p className="stat-value">{stats.regular}</p>
        </div>
        <div className="stat-box">
          <h3>Shiny</h3>
          <p className="stat-value">{stats.shiny}</p>
        </div>
        <div className="stat-box">
          <h3>XXL</h3>
          <p className="stat-value">{stats.xxl}</p>
        </div>
      </div>

      <div className="action-bar">
        <button onClick={handleAddPokemon} className="add-btn">
          + Add Pokemon
        </button>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'regular' ? 'active' : ''}`}
          onClick={() => setActiveTab('regular')}
        >
          Regular
        </button>
        <button
          className={`tab ${activeTab === 'shiny' ? 'active' : ''}`}
          onClick={() => setActiveTab('shiny')}
        >
          Shiny
        </button>
        <button
          className={`tab ${activeTab === 'xxl' ? 'active' : ''}`}
          onClick={() => setActiveTab('xxl')}
        >
          XXL
        </button>
      </div>

      <PokemonList
        category={activeTab}
        onEdit={handleEditPokemon}
        refreshKey={refreshKey}
      />

      {showForm && (
        <PokemonForm
          pokemon={selectedPokemon}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setSelectedPokemon(null);
          }}
        />
      )}
    </div>
  );
}
