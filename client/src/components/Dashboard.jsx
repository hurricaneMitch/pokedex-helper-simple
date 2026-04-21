import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import pokemonService from '../services/pokemonService';
import PokemonGrid from './PokemonGrid';
import PokemonForm from './PokemonForm';
import PokemonList from './PokemonList';
import '../styles/Dashboard.css';

const CATEGORIES = [
  { id: 'regular',      label: '● Regular'    },
  { id: 'shiny',        label: '★ Shiny'      },
  { id: 'xxl',          label: '▲ XXL'        },
  { id: 'hundo',        label: '💯 Hundo'     },
  { id: 'littleleague', label: 'L Little'     },
  { id: 'greatleague',  label: 'G Great'      },
  { id: 'ultraleague',  label: 'U Ultra'      },
  { id: 'masterleague', label: 'M Master'     },
  { id: 'dynamax',      label: '⬛ Dynamax'   },
  { id: 'gigantamax',   label: '🌀 Gigantamax'},
];

export default function Dashboard() {
  const [viewMode, setViewMode]               = useState('grid');
  const [activeTab, setActiveTab]             = useState('regular');
  const [searchQuery, setSearchQuery]         = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [allTracked, setAllTracked]           = useState([]);
  const [stats, setStats]                     = useState({ regular: 0, shiny: 0, xxl: 0, hundo: 0, littleleague: 0, greatleague: 0, ultraleague: 0, masterleague: 0, dynamax: 0, gigantamax: 0 });
  const [refreshKey, setRefreshKey]           = useState(0);
  const [bulkCategory, setBulkCategory]       = useState(null);
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

  const handleGridSelect = (pokemonId, name) => {
    if (bulkCategory) return; // swallow — bulk mode handles clicks
    setSelectedPokemon({ pokemonId, name });
  };

  const handleEditPokemon = (pokemon) => {
    setSelectedPokemon(pokemon);
  };

  const handleSave = () => {
    setSelectedPokemon(null);
    setRefreshKey((k) => k + 1);
  };

  // Optimistically add a single category entry when in bulk mode
  const handleBulkAdd = useCallback(async (pokemonId, name) => {
    const alreadyHas = allTracked.some(
      (t) => t.pokemonId === pokemonId && t.category === bulkCategory
    );
    if (alreadyHas) return;

    // Optimistic update
    const tempEntry = { _id: `temp-${Date.now()}-${pokemonId}`, pokemonId, name, category: bulkCategory };
    setAllTracked((prev) => [...prev, tempEntry]);
    setStats((prev) => ({ ...prev, [bulkCategory]: prev[bulkCategory] + 1 }));

    try {
      await pokemonService.create({ pokemonId, name, category: bulkCategory, notes: '' });
    } catch (err) {
      console.error('Bulk add failed', err);
      // Revert on failure
      setAllTracked((prev) => prev.filter((t) => t !== tempEntry));
      setStats((prev) => ({ ...prev, [bulkCategory]: prev[bulkCategory] - 1 }));
    }
  }, [allTracked, bulkCategory]);

  const toggleBulkCategory = (catId) => {
    setBulkCategory((prev) => (prev === catId ? null : catId));
    setSelectedPokemon(null);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setBulkCategory(null);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Pokédex Tracker</h1>
        <div className="header-stats">
          <span className="hstat regular"      title="Regular">● {stats.regular}</span>
          <span className="hstat shiny"        title="Shiny">★ {stats.shiny}</span>
          <span className="hstat xxl"          title="XXL">▲ {stats.xxl}</span>
          <span className="hstat hundo"        title="Hundo">💯 {stats.hundo}</span>
          <span className="hstat littleleague" title="Little League">L {stats.littleleague}</span>
          <span className="hstat greatleague"  title="Great League">G {stats.greatleague}</span>
          <span className="hstat ultraleague"  title="Ultra League">U {stats.ultraleague}</span>
          <span className="hstat masterleague" title="Master League">M {stats.masterleague}</span>
          <span className="hstat dynamax"      title="Dynamax">D {stats.dynamax}</span>
          <span className="hstat gigantamax"   title="Gigantamax">GX {stats.gigantamax}</span>
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
            onClick={() => handleViewModeChange('grid')}
          >
            All Pokémon
          </button>
          <button
            className={viewMode === 'collection' ? 'active' : ''}
            onClick={() => handleViewModeChange('collection')}
          >
            My Collection
          </button>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className={`bulk-controls ${bulkCategory ? 'bulk-active' : ''}`}>
          <span className="bulk-label">Bulk Add:</span>
          <div className="bulk-buttons">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`bulk-btn bulk-${cat.id} ${bulkCategory === cat.id ? 'active' : ''}`}
                onClick={() => toggleBulkCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {bulkCategory && (
            <button className="bulk-exit" onClick={() => setBulkCategory(null)}>
              ✕ Done
            </button>
          )}
        </div>
      )}

      {viewMode === 'grid' ? (
        <PokemonGrid
          trackedPokemon={allTracked}
          searchQuery={searchQuery}
          onSelect={handleGridSelect}
          bulkCategory={bulkCategory}
          onBulkSelect={handleBulkAdd}
        />
      ) : (
        <>
          <div className="tabs">
            {['regular', 'shiny', 'xxl', 'hundo', 'littleleague', 'greatleague', 'ultraleague', 'masterleague', 'dynamax', 'gigantamax'].map((cat) => (
              <button
                key={cat}
                className={`tab ${activeTab === cat ? 'active' : ''}`}
                onClick={() => setActiveTab(cat)}
              >
                {{ regular: 'Regular', shiny: 'Shiny', xxl: 'XXL', hundo: 'Hundo', littleleague: 'Little', greatleague: 'Great', ultraleague: 'Ultra', masterleague: 'Master', dynamax: 'Dynamax', gigantamax: 'Gigantamax' }[cat]}
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
