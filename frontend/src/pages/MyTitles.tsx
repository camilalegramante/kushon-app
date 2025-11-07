import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type TitleResponse } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './MyTitles.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE_URL.replace('/api', '');

const MyTitles = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [myTitles, setMyTitles] = useState<TitleResponse[]>([]);
  const [filteredTitles, setFilteredTitles] = useState<TitleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const loadMyTitles = async () => {
      try {
        const response = await apiService.getTitles();
        if (response.success) {
          const titles = response.data;
          const myTitles: TitleResponse[] = [];

          for (const title of titles) {
            try {
              const volumesResponse = await apiService.getTitleVolumes(title.id);
              const volumes = volumesResponse.success ? volumesResponse.data : [];
              const progress = await apiService.getUserVolumeProgress(title.id);

              let volumesWithProgress = volumes;
              if (progress.success) {
                volumesWithProgress = volumes.map(vol => {
                  const userVol = progress.data.find(v => v.volumeId === vol.id);
                  return {
                    ...vol,
                    owned: userVol ? userVol.owned : false
                  };
                });

                if (volumesWithProgress.some(v => v.owned)) {
                  myTitles.push({ ...title, volumes: volumesWithProgress });
                }
              }
            } catch (error) {
              console.error('Error loading title volumes:', error);
            }
          }

          setMyTitles(myTitles);
          setFilteredTitles(myTitles);
        }
      } catch (error) {
        showToast('Erro ao carregar títulos. Verifique se o backend está rodando.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadMyTitles();
  }, []);

  useEffect(() => {
    let filtered = myTitles;

    if (searchTerm) {
      filtered = filtered.filter(title =>
        title.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        title.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        title.genre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(title => title.status === statusFilter);
    }

    setFilteredTitles(filtered);
  }, [myTitles, searchTerm, statusFilter]);

  const handleTitleClick = (titleId: string) => {
    navigate(`/title/${titleId}`);
  };

  const handleBackClick = () => {
    navigate('/user');
  };

  const renderTitleCard = (title: TitleResponse) => {
    const totalCount = title.volumes ? title.volumes.length : 0;
    const ownedCount = title.volumes ? title.volumes.filter((v: any) => v.owned).length : 0;
    const progressPercent = totalCount > 0 ? (ownedCount / totalCount) * 100 : 0;

    let statusText = '';
    let statusClass = '';
    switch (title.status) {
      case 'ONGOING':
        statusText = 'Em andamento';
        statusClass = 'badge-ongoing';
        break;
      case 'COMPLETED':
        statusText = 'Completo';
        statusClass = 'badge-completed';
        break;
      case 'HIATUS':
        statusText = 'Em hiato';
        statusClass = 'badge-hiatus';
        break;
      default:
        statusText = '';
        statusClass = '';
    }

    return (
      <div
        key={title.id}
        className="title-card"
        onClick={() => handleTitleClick(title.id)}
      >
        <div className="title-image">
          <img
            src={title.coverImage ? `${BASE_URL}${title.coverImage}` : 'https://via.placeholder.com/300x400/3498db/ffffff?text=Sem+Capa'}
            alt={title.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/95a5a6/ffffff?text=Erro+Imagem';
            }}
          />
        </div>
        <div className="title-info">
          <h3 className="title-name">{title.name}</h3>
          <p className="title-author">{title.author}</p>
          <p className="title-progress">
            {ownedCount} de {totalCount} volumes
          </p>
          {statusText && (
            <span className={`title-status-badge ${statusClass}`}>{statusText}</span>
          )}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="title-genre">{title.genre || 'Gênero não informado'}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <button className="back-button" onClick={handleBackClick}>
          ← Voltar
        </button>
        <h1>Meus Títulos</h1>
        <p className="titles-count">{filteredTitles.length} de {myTitles.length} títulos</p>
      </div>

      <div className="filters-section">
        <div className="search-section">
          <label htmlFor="search-input" className="search-label">Buscar títulos:</label>
          <input
            id="search-input"
            type="text"
            placeholder="Buscar por título, autor ou gênero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-container">
          <label htmlFor="status-filter">Filtrar por status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter-select"
          >
            <option value="ALL">Todos</option>
            <option value="ONGOING">Em andamento</option>
            <option value="COMPLETED">Completo</option>
            <option value="HIATUS">Em hiato</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-message">
          <p>Carregando seus títulos...</p>
        </div>
      ) : myTitles.length === 0 ? (
        <div className="empty-message">
          <p>Você ainda não possui títulos em sua lista.</p>
          <p>
            <button
              className="link-button"
              onClick={() => navigate('/all-titles')}
            >
              Explore todos os títulos disponíveis
            </button>
          </p>
        </div>
      ) : filteredTitles.length === 0 ? (
        <div className="empty-message">
          <p>Nenhum título encontrado com os filtros aplicados.</p>
          <p>Tente alterar a busca ou o filtro de status.</p>
        </div>
      ) : (
        <div className="titles-grid">
          {filteredTitles.map(renderTitleCard)}
        </div>
      )}
    </>
  );
};

export default MyTitles;