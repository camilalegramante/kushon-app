import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageUpload from '../components/ImageUpload';
import VolumeUploadGrid from '../components/VolumeUploadGrid';
import { apiService, type Publisher } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './EditTitle.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE_URL.replace('/api', '');

interface VolumeUpload {
  id?: string;
  number: number;
  title: string;
  file?: File;
  preview?: string;
  existingImage?: string;
}

interface EditTitleData {
  id: string;
  name: string;
  synopsis: string;
  author: string;
  genre: string;
  publisherId: string;
  totalVolumes: number;
  mainCover?: {
    file?: File;
    preview?: string;
    existing?: string;
  };
  volumeCovers: VolumeUpload[];
}

const EditTitle = () => {
  const { titleId } = useParams<{ titleId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [titleData, setTitleData] = useState<EditTitleData>({
    id: '',
    name: '',
    synopsis: '',
    author: '',
    genre: '',
    publisherId: '',
    totalVolumes: 1,
    volumeCovers: []
  });
  const [status, setStatus] = useState<'ONGOING' | 'COMPLETED' | 'HIATUS'>('ONGOING');

  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!titleId) {
        setError('ID do título não fornecido');
        setLoading(false);
        return;
      }

      try {
        const [titleResponse, volumesResponse, publishersResponse] = await Promise.all([
          apiService.getTitle(titleId),
          apiService.getTitleVolumes(titleId),
          apiService.getPublishers()
        ]);

        if (!titleResponse.success) {
          throw new Error('Título não encontrado');
        }

        if (publishersResponse.success) {
          setPublishers(publishersResponse.data);
        }

        const title = titleResponse.data;
        const volumes = volumesResponse.success ? volumesResponse.data : [];

        const volumeCovers: VolumeUpload[] = volumes.map(vol => ({
          id: vol.id,
          number: vol.number,
          title: vol.title || `${title.name} Vol. ${vol.number}`,
          existingImage: vol.coverImage ? `${BASE_URL}${vol.coverImage}` : undefined
        }));

        setTitleData({
          id: title.id,
          name: title.name,
          synopsis: title.synopsis || '',
          author: title.author || '',
          genre: title.genre || '',
          publisherId: title.publisherId || '',
          totalVolumes: volumes.length || 1,
          mainCover: {
            existing: title.coverImage ? `${BASE_URL}${title.coverImage}` : undefined
          },
          volumeCovers
        });

        setStatus(title.status as 'ONGOING' | 'COMPLETED' | 'HIATUS' || 'ONGOING');

      } catch (error) {
        setError(`Erro ao carregar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [titleId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setTitleData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTotalVolumesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTotal = parseInt(e.target.value) || 1;

    setTitleData(prev => {
      const currentVolumes = prev.volumeCovers;
      const updatedVolumes: VolumeUpload[] = [];

      for (let i = 1; i <= newTotal; i++) {
        const existingVolume = currentVolumes.find(vol => vol.number === i);
        if (existingVolume) {
          updatedVolumes.push(existingVolume);
        } else {
          updatedVolumes.push({
            number: i,
            title: `${prev.name || 'Título'} Vol. ${i}`
          });
        }
      }

      return {
        ...prev,
        totalVolumes: newTotal,
        volumeCovers: updatedVolumes
      };
    });
  };

  const handleMainCoverSelect = (file: File, preview: string) => {
    setTitleData(prev => ({
      ...prev,
      mainCover: {
        ...prev.mainCover,
        file,
        preview
      }
    }));
  };

  const handleVolumesChange = (volumes: VolumeUpload[]) => {
    setTitleData(prev => ({
      ...prev,
      volumeCovers: volumes
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const hasMainCoverUpload = titleData.mainCover?.file;
      const hasVolumeUploads = titleData.volumeCovers.some(vol => vol.file);
      const volumesPayload = titleData.volumeCovers.map(vol => ({
        number: vol.number,
        title: vol.title
      }));

      if (hasMainCoverUpload || hasVolumeUploads) {
        const formData = new FormData();
        const titleInfo = {
          name: titleData.name,
          synopsis: titleData.synopsis,
          author: titleData.author,
          genre: titleData.genre,
          status: status,
          publisherId: titleData.publisherId,
          volumes: volumesPayload
        };
        formData.append('data', JSON.stringify(titleInfo));
        if (hasMainCoverUpload && titleData.mainCover?.file) {
          formData.append('mainCover', titleData.mainCover.file);
        }
        titleData.volumeCovers.forEach((vol) => {
          if (vol.file) {
            formData.append(`volume_${vol.number}`, vol.file);
          }
        });
        const response = await apiService.updateTitleWithImages(titleData.id, formData);
        if (!response.success) {
          throw new Error(response.message || 'Erro ao atualizar título com imagens');
        }
      } else {
        const response = await apiService.updateTitle(titleData.id, {
          name: titleData.name,
          synopsis: titleData.synopsis,
          author: titleData.author,
          genre: titleData.genre,
          status: status,
          publisherId: titleData.publisherId,
          volumes: volumesPayload
        });
        if (!response.success) {
          throw new Error(response.message || 'Erro ao atualizar título');
        }
      }
      showToast('Título atualizado com sucesso!', 'success');
      navigate('/admin', { state: { activeTab: 'manage' } });
    } catch (error) {
      const errorMessage = `Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      showToast(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <p>Carregando dados do título...</p>
      </>
    );
  }

  if (error && !titleData.id) {
    return (
      <>
        <div className="error-message">
          {error}
        </div>
        <button onClick={() => navigate('/admin')} className="back-button">
          ← Voltar ao Painel
        </button>
      </>
    );
  }

  return (
    <>
        <div className="edit-title-header">
          <button onClick={() => navigate('/admin')} className="back-button">
            ← Voltar ao Painel
          </button>
          <h2>Editar Título: {titleData.name}</h2>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="error-close">×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-title-form">
          <div className="form-section">
            <h3>Informações Básicas</h3>

            <div className="form-group">
              <label htmlFor="name">Nome do Título *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={titleData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Autor *</label>
              <input
                type="text"
                id="author"
                name="author"
                value={titleData.author}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="genre">Gênero *</label>
              <input
                type="text"
                id="genre"
                name="genre"
                value={titleData.genre}
                onChange={handleInputChange}
                placeholder="ex: Ação, Aventura"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="publisherId">Editora * <small style={{ color: '#666' }}>(Crie novas no painel de administração)</small></label>
              <select
                id="publisherId"
                name="publisherId"
                value={titleData.publisherId}
                onChange={(e) => setTitleData(prev => ({ ...prev, publisherId: e.target.value }))}
                required
              >
                <option value="">Selecione uma editora</option>
                {publishers.map(pub => (
                  <option key={pub.id} value={pub.id}>
                    {pub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="synopsis">Sinopse *</label>
              <textarea
                id="synopsis"
                name="synopsis"
                value={titleData.synopsis}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>

              <div className="form-group">
                <label htmlFor="status">Status do Título *</label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ONGOING' | 'COMPLETED' | 'HIATUS')}
                  required
                >
                  <option value="ONGOING">Em andamento</option>
                  <option value="COMPLETED">Completo</option>
                  <option value="HIATUS">Em hiato</option>
                </select>
              </div>
          </div>

          <div className="form-section">
            <h3>Capa Principal</h3>
            <ImageUpload
              label="Capa Principal do Título"
              placeholder="Upload nova capa (opcional)"
              preview={titleData.mainCover?.preview}
              existingImage={titleData.mainCover?.existing}
              onImageSelect={handleMainCoverSelect}
            />
          </div>

          <div className="form-section">
            <h3>Gerenciamento de Volumes</h3>

            <div className="form-group">
              <label htmlFor="totalVolumes">Total de Volumes *</label>
              <input
                type="number"
                id="totalVolumes"
                name="totalVolumes"
                value={titleData.totalVolumes}
                onChange={handleTotalVolumesChange}
                min="1"
                max="200"
                required
              />
              <small>
                Volumes atuais: {titleData.volumeCovers.filter(v => v.id).length} |
                Novos volumes: {titleData.volumeCovers.filter(v => !v.id).length}
              </small>
            </div>

            <VolumeUploadGrid
              totalVolumes={titleData.totalVolumes}
              titleName={titleData.name || 'Título'}
              onVolumesChange={handleVolumesChange}
              existingVolumes={titleData.volumeCovers}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/admin')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
    </>
  );
};

export default EditTitle;