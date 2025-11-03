import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VolumeGrid from '../components/VolumeGrid';
import { apiService, type TitleResponse } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './TitleDetail.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE_URL.replace('/api', '');

interface UserVolume {
  id: string;
  number: number;
  title?: string;
  coverImage?: string;
  owned: boolean;
}

const TitleDetail = () => {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [title, setTitle] = useState<TitleResponse | null>(null);
  const [volumes, setVolumes] = useState<UserVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [emailNotification, setEmailNotification] = useState(false);
  const [savingNotification, setSavingNotification] = useState(false);

  useEffect(() => {
    const loadTitle = async () => {
      if (!titleId) return;

      try {
        const [titleResponse, volumesResponse, userProgressResponse, notificationResponse] = await Promise.all([
          apiService.getTitle(titleId),
          apiService.getTitleVolumes(titleId),
          apiService.getUserVolumeProgress(titleId).catch(() => ({ success: false, data: [] })),
          apiService.getNotificationPreference(titleId).catch(() => ({ success: false, data: { emailOnNewVolume: false } }))
        ]);

        if (titleResponse.success) {
          setTitle(titleResponse.data);
        }

        if (volumesResponse.success) {
          const userProgressMap = new Map();
          if (userProgressResponse.success) {
            userProgressResponse.data.forEach(progress => {
              userProgressMap.set(progress.volumeId, progress.owned);
            });
          }

          const userVolumes = volumesResponse.data.map(vol => ({
            id: vol.id,
            number: vol.number,
            title: vol.title,
            coverImage: vol.coverImage,
            owned: userProgressMap.get(vol.id) || false
          }));

          setVolumes(userVolumes);
        }

        if (notificationResponse.success) {
          setEmailNotification(notificationResponse.data.emailOnNewVolume);
        }
      } catch (error) {
        console.error('Erro ao carregar título:', error);
        setError('Erro ao carregar título. Verifique se o backend está rodando.');
      } finally {
        setLoading(false);
      }
    };

    loadTitle();
  }, [titleId]);

  if (loading) {
    return (
      <>
        <p>Carregando título...</p>
      </>
    );
  }

  if (error && !title) {
    return (
      <>
        <div className="error-message" style={{ color: '#e74c3c', marginBottom: '1rem' }}>
          {error}
        </div>
        <button onClick={() => navigate('/user')}>← Voltar para Meus Títulos</button>
      </>
    );
  }

  if (!title) {
    return (
      <>
        <p>Título não encontrado</p>
        <button onClick={() => navigate('/user')}>← Voltar para Meus Títulos</button>
      </>
    );
  }

  const handleVolumeToggle = (volumeNumber: number) => {
    const updatedVolumes = volumes.map(vol => 
      vol.number === volumeNumber 
        ? { ...vol, owned: !vol.owned }
        : vol
    );

    setVolumes(updatedVolumes);
  };

  const handleSave = async () => {
    if (!titleId || !title || saving) return;

    setSaving(true);
    setError(null);

    try {
      const volumeData = volumes.map(vol => ({
        volumeId: vol.id,
        owned: vol.owned
      }));

      const response = await apiService.updateUserVolumeProgress(titleId, volumeData);

      if (response.success) {
        showToast('Progresso salvo com sucesso!', 'success');
      } else {
        throw new Error(response.message || 'Falha ao salvar progresso');
      }
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      setError(`Erro ao salvar progresso: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!titleId || savingNotification) return;

    const newValue = !emailNotification;

    setEmailNotification(newValue);
    setSavingNotification(true);
    setError(null);

    try {
      const response = await apiService.updateNotificationPreference(titleId, newValue);

      if (response.success) {
        showToast(
          newValue
            ? 'Notificações por email ativadas!'
            : 'Notificações por email desativadas!',
          'success'
        );
      } else {
        setEmailNotification(!newValue);
        throw new Error(response.message || 'Falha ao atualizar preferência');
      }
    } catch (error) {
      setEmailNotification(!newValue);
      console.error('Erro ao atualizar notificação:', error);
      setError(`Erro ao atualizar notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setSavingNotification(false);
    }
  };

  return (
    <>
        <button className="back-button" onClick={() => navigate('/user')}>
          ← Voltar para Meus Títulos
        </button>

        {error && (
          <div className="error-message" style={{ color: '#e74c3c', marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee', borderRadius: '6px', border: '1px solid #e74c3c' }}>
            {error}
            <button
              onClick={() => setError(null)}
              style={{ float: 'right', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ×
            </button>
          </div>
        )}
        
        <div className="title-detail-container">
          <div className="title-detail-image">
            <img
              src={title.coverImage ? `${BASE_URL}${title.coverImage}` : 'https://via.placeholder.com/300x400/3498db/ffffff?text=Sem+Capa'}
              alt={title.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/95a5a6/ffffff?text=Erro+Imagem';
              }}
            />
          </div>
          
          <div className="title-detail-info">
            <h1 className="title-detail-name">{title.name}</h1>
            <p className="title-detail-author">Por: {title.author || 'Autor não informado'}</p>
            <p className="title-detail-genre">Gênero: {title.genre || 'Não informado'}</p>
            
            <div className="synopsis-section">
              <h3>Sinopse</h3>
              <p className="synopsis-text">{title.synopsis || 'Sinopse não disponível'}</p>
            </div>

            <div className="volumes-section">
              <VolumeGrid
                volumes={volumes.map(vol => ({
                  number: vol.number,
                  title: vol.title || `Volume ${vol.number}`,
                  cover: vol.coverImage ? `${BASE_URL}${vol.coverImage}` : `https://via.placeholder.com/150x200/3498db/ffffff?text=Vol.${vol.number}`,
                  owned: vol.owned
                }))}
                onVolumeToggle={handleVolumeToggle}
              />
              <button
                className="save-button"
                onClick={handleSave}
                disabled={saving}
                style={{ opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Salvando...' : 'Salvar Progresso'}
              </button>
            </div>

            <div className="notification-section">
              <h3>Notificações</h3>
              <div className="notification-control">
                <label className="notification-label">
                  <input
                    type="checkbox"
                    checked={emailNotification}
                    onChange={handleNotificationToggle}
                    disabled={savingNotification}
                  />
                  <span className="notification-text">
                    Receber email quando novos volumes forem adicionados
                  </span>
                  {savingNotification && <span className="saving-indicator">Salvando...</span>}
                </label>
              </div>
            </div>
          </div>
        </div>
  </>
  );
};

export default TitleDetail;