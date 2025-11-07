import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type TitleResponse } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './AllTitles.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE_URL.replace('/api', '');

const AllTitles = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [titles, setTitles] = useState<TitleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadTitles = async () => {
      try {
        const response = await apiService.getTitles();
        if (response.success) {
          const sortedTitles = response.data.slice().sort((a, b) =>
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          );
          setTitles(sortedTitles);
        }
      } catch (error) {
        showToast('Erro ao carregar títulos. Verifique se o backend está rodando.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadTitles();
  }, []);

  const handleTitleClick = (titleId: string) => {
    navigate(`/title/${titleId}`);
  };

  const handleBackClick = () => {
    navigate('/user');
  };

  const filteredTitles = titles.filter(title =>
    title.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    title.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    title.genre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTitleCard = (title: TitleResponse) => (
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
          0 de {title.volumes?.length || 0} volumes
        </p>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: '0%' }}
          ></div>
        </div>
        <p className="title-genre">{title.genre || 'Gênero não informado'}</p>
      </div>
    </div>
  );

  return (
    <>

        <div className="page-header">
          <button className="back-button" onClick={handleBackClick}>
            ← Voltar
          </button>
          <h1>Todos os Títulos</h1>
          <p className="titles-count">{titles.length} títulos encontrados</p>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="Buscar por título, autor ou gênero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {loading ? (
          <div className="loading-message">
            <p>Carregando títulos...</p>
          </div>
        ) : filteredTitles.length === 0 ? (
          <div className="empty-message">
            {searchTerm ? (
              <p>Nenhum título encontrado para "{searchTerm}"</p>
            ) : (
              <p>Nenhum título foi cadastrado na plataforma ainda.</p>
            )}
          </div>
        ) : (
          <div className="titles-grid">
            {filteredTitles.map(renderTitleCard)}
          </div>
        )}

  </>);
};

export default AllTitles;