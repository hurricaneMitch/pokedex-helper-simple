import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import pokemonService from '../services/pokemonService';
import PokemonGrid from './PokemonGrid';
import PokemonForm from './PokemonForm';
import PokemonList from './PokemonList';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [viewMode, setViewMode]           = useState('grid');       // 'grid' | 'collection'
  const [activeTab, setActiveTab]         = useState('regular');
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [allTracked, setAllTracked]       = useState([]);
  const [stats, setStats]                 = useState({ shiny: 0, regular: 0, xxl: 0 });
  const [refreshKey, setRefreshKey]       = useState(0);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const [statsData, trackedData] = await Promise.all([
        pokemonService.getStats(),
        pokemonService.getAll()
      ]);
      setStats(statsData);
      setAllTracked(trackedData);
    } catch {
      console.error('Failed to refresh data');
    }
  }, []);

  useEffect(() => { refresh(); }, [refreshKey]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Called when a card in the Pokédex grid is clicked
  const handleGridSelect = (pokemonId, name) => {
    setSelectedPokemon({ pokemonId, name });
  };

  // Called when Edit is clicked in My Collection
  const handleEditPokemon = (pokemon) => {
    setSelectedPokemon(pokemon);
  };

  const handleSave = () => {
    setSelectedPokemon(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Pokémon Go Tracker</h1>
        <div className="header-stats">
          <span className="hstat regular">● {stats.regular}</span>
          <span className="hstat shiny">★ {stats.shiny}</span>
          <span className="hstat xxl">▲ {stats.xxl}</span>
        </div>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="view-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search Pokémon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={viewMode === 'collection'}
          />
        </div>
        <div className="view-toggle">
          <button
            className={viewMode === 'grid' ? 'active' : ''}
            onClick={() => setViewMode('grid')}
          >
            All Pokémon
          </button>
          <button
            className={viewMode === 'collection' ? 'active' : ''}
            onClick={() => setViewMode('collection')}
          >
            My Collection
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <PokemonGrid
          trackedPokemon={allTracked}
          searchQuery={searchQuery}
          onSelect={handleGridSelect}
        />
      ) : (
        <>
          <div className="tabs">
            {['regular', 'shiny', 'xxl'].map((cat) => (
              <button
                key={cat}
                className={`tab ${activeTab === cat ? 'active' : ''}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          <PokemonList
            category={activeTab}
            onEdit={handleEditPokemon}
            refreshKey={refreshKey}
          />
        </>
      )}

      {selectedPokemon && (
        <PokemonForm
          pokemon={selectedPokemon}
          onSave={handleSave}
          onCancel={() => setSelectedPokemon(null)}
        />
      )}
    </div>
  );
}
