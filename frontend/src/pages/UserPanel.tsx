import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type TitleResponse } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import TitleCardSkeleton from '../components/TitleCardSkeleton';
import './UserPanel.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE_URL.replace('/api', '');

const UserPanel = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [myTitles, setMyTitles] = useState<TitleResponse[]>([]);
  const [latestTitles, setLatestTitles] = useState<TitleResponse[]>([]);
  const [_allTitlesCount, setAllTitlesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTitles = async () => {
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
            } catch {
            }
          }
          setMyTitles(myTitles);

          const sortedTitles = titles.slice().sort((a, b) =>
            new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
          );

          const latestWithVolumes: TitleResponse[] = await Promise.all(
            sortedTitles.slice(0, 6).map(async (title) => {
              try {
                const volumesRes = await apiService.getTitleVolumes(title.id);
                if (volumesRes.success) {
                  return { ...title, volumes: volumesRes.data };
                }
              } catch {}
              return { ...title, volumes: [] };
            })
          );
          setLatestTitles(latestWithVolumes);
          setAllTitlesCount(titles.length);
        }
      } catch (error) {
        console.error('Erro ao carregar títulos:', error);
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

  const renderSeeMoreCard = () => (
    <div
      className="title-card see-more-card"
      onClick={() => navigate('/my-titles')}
    >
      <div className="see-more-content">
        <div className="see-more-icon">🔍︎</div>
        <div className="see-more-text">Ver todos</div>
      </div>
    </div>
  );

  const renderSeeMoreAllTitlesCard = () => (
    <div
      className="title-card see-more-card"
      onClick={() => navigate('/all-titles')}
    >
      <div className="see-more-content">
        <div className="see-more-icon">🔍︎</div>
        <div className="see-more-text">Ver mais</div>
      </div>
    </div>
  );

  const renderTitleCard = (title: TitleResponse, showUserProgress = true) => {
    const totalCount = title.volumes ? title.volumes.length : 0;
    let ownedCount = 0;
    let progressPercent = 0;
    if (showUserProgress && title.volumes) {
      ownedCount = title.volumes.filter((v: any) => v.owned).length;
      progressPercent = totalCount > 0 ? (ownedCount / totalCount) * 100 : 0;
    }

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
          <p className="title-progress">
            {showUserProgress
              ? `${ownedCount} de ${totalCount} volumes`
              : `${totalCount} volumes`}
          </p>
          {statusText && (
            <span className={`title-status-badge ${statusClass}`}>{statusText}</span>
          )}
          {showUserProgress && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          )}
          <p className="title-genre">{title.genre || 'Gênero não informado'}</p>
        </div>
      </div>
    );
  };

  return (
    <>

        <section className="titles-section">
          <h2
            className="clickable-title"
            onClick={() => navigate('/my-titles')}
          >
            Meus Títulos ({myTitles.length})
          </h2>
          {loading ? (
            <div className="titles-grid">
              {Array.from({ length: 3 }).map((_, index) => (
                <TitleCardSkeleton key={index} />
              ))}
            </div>
          ) : myTitles.length === 0 ? (
            <div className="empty-message">
              <p>Você ainda não possui títulos cadastrados.</p>
              <p>
                Explore os títulos disponíveis abaixo ou{' '}
                <button
                  className="link-button"
                  onClick={() => navigate('/all-titles')}
                >
                  veja todos os títulos cadastrados
                </button>
              </p>
            </div>
          ) : (
            <div className="titles-grid">
              {myTitles.map(title => renderTitleCard(title, true))}
              {renderSeeMoreCard()}
            </div>
          )}
        </section>

        <section className="titles-section">
          <h2 className="compact-title">Últimos Títulos Cadastrados</h2>

          {loading ? (
            <div className="titles-grid compact">
              {Array.from({ length: 6 }).map((_, index) => (
                <TitleCardSkeleton key={index} />
              ))}
            </div>
          ) : latestTitles.length === 0 ? (
            <div className="empty-message">
              <p>Nenhum título foi cadastrado na plataforma ainda.</p>
            </div>
          ) : (
            <div className="titles-grid compact">
              {latestTitles.map(title => renderTitleCard(title, false))}
              {renderSeeMoreAllTitlesCard()}
            </div>
          )}
        </section>

  </>
  );
};
export default UserPanel;
