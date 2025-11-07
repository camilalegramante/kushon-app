import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import ImageUpload from '../components/ImageUpload';
import VolumeUploadGrid from '../components/VolumeUploadGrid';
import { apiService, type Publisher, type TitleResponse } from '../services/api';
import './AdminPanel.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = API_BASE_URL.replace('/api', '');

interface VolumeUpload {
  number: number;
  title: string;
  file?: File;
  preview?: string;
}

interface NewTitle {
  name: string;
  synopsis: string;
  author: string;
  genre: string;
  totalVolumes: number;
  mainCover?: {
    file: File;
    preview: string;
  };
  volumeCovers: VolumeUpload[];
}


const AdminPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');
  const [newTitle, setNewTitle] = useState<NewTitle>({
    name: '',
    synopsis: '',
    author: '',
    genre: '',
    totalVolumes: 1,
    volumeCovers: [{
      number: 1,
      title: 'Título Vol. 1'
    }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [titles, setTitles] = useState<TitleResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [publishersResponse, titlesResponse] = await Promise.all([
          apiService.getPublishers(),
          apiService.getTitles()
        ]);

        if (publishersResponse.success) {
          setPublishers(publishersResponse.data);
        }

        if (titlesResponse.success) {
          const titlesWithVolumes: TitleResponse[] = await Promise.all(
            titlesResponse.data.map(async (title) => {
              try {
                const volumesRes = await apiService.getTitleVolumes(title.id);
                if (volumesRes.success) {
                  return { ...title, volumes: volumesRes.data };
                }
              } catch {}
              return { ...title, volumes: [] };
            })
          );
          setTitles(titlesWithVolumes);
        }
      } catch (error) {
        showToast('Erro ao carregar dados. Verifique se o backend está rodando.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!newTitle.mainCover) {
        showToast('Por favor, faça upload da capa principal', 'warning');
        return;
      }

      if (newTitle.volumeCovers.length !== newTitle.totalVolumes) {
        showToast('Por favor, faça upload de todas as capas dos volumes', 'warning');
        return;
      }

      const missingCovers = newTitle.volumeCovers.filter(v => !v.file).length;
      if (missingCovers > 0) {
        showToast(`Ainda faltam ${missingCovers} capas de volumes para fazer upload`, 'warning');
        return;
      }

      if (publishers.length === 0) {
        showToast('Nenhuma editora encontrada. Verifique se o backend está configurado.', 'error');
        return;
      }

      const formData = new FormData();

      const titleData = {
        name: newTitle.name,
        synopsis: newTitle.synopsis || '',
        author: newTitle.author || '',
        genre: newTitle.genre || '',
        publisherId: publishers[0].id,
        volumes: newTitle.volumeCovers.map(vol => ({
          number: vol.number,
          title: vol.title
        }))
      };

      formData.append('data', JSON.stringify(titleData));

      if (newTitle.mainCover.file) {
        formData.append('mainCover', newTitle.mainCover.file);
      }

      newTitle.volumeCovers.forEach((vol) => {
        if (vol.file) {
          formData.append(`volume_${vol.number}`, vol.file);
        }
      });
      const response = await apiService.createTitle(formData);
      
      if (response.success) {
        const titlesResponse = await apiService.getTitles();
        if (titlesResponse.success) {
          setTitles(titlesResponse.data);
        }
        setNewTitle({
          name: '',
          synopsis: '',
          author: '',
          genre: '',
          totalVolumes: 1,
          volumeCovers: [{
            number: 1,
            title: 'Título Vol. 1'
          }]
        });

        showToast('Título adicionado com sucesso!', 'success');
        setActiveTab('manage');
      }
    } catch (error) {
      showToast('Erro ao adicionar título. Verifique se o backend está rodando.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'totalVolumes' ? parseInt(value) || 1 : value;

    setNewTitle(prev => {
      const updated = {
        ...prev,
        [name]: newValue
      };

      if (name === 'totalVolumes') {
        const volumeCount = parseInt(value) || 1;
        const volumes: VolumeUpload[] = [];
        for (let i = 1; i <= volumeCount; i++) {
          volumes.push({
            number: i,
            title: `${updated.name || 'Título'} Vol. ${i}`
          });
        }
        updated.volumeCovers = volumes;
      }

      return updated;
    });
  };

  const handleMainCoverSelect = (file: File, preview: string) => {
    setNewTitle(prev => ({
      ...prev,
      mainCover: { file, preview }
    }));
  };

  const handleVolumesChange = (volumes: VolumeUpload[]) => {
    setNewTitle(prev => ({
      ...prev,
      volumeCovers: volumes
    }));
  };

  const handleEditTitle = (title: TitleResponse) => {
    navigate(`/admin/edit/${title.id}`);
  };


  const handleDeleteTitle = async (titleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este título? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await apiService.deleteTitle(titleId);

      if (response.success) {
        const titlesResponse = await apiService.getTitles();
        if (titlesResponse.success) {
          setTitles(titlesResponse.data);
        }

        showToast('Título excluído com sucesso!', 'success');
      }
    } catch (error) {
      showToast('Erro ao excluir título. Verifique se o backend está rodando.', 'error');
    }
  };


  return (
    <>
        <h2>Painel do Administrador</h2>
        
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            Adicionar Título
          </button>
          <button 
            className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            Gerenciar Títulos
          </button>
        </div>

        {activeTab === 'add' && (
          <div className="tab-content">
            <form onSubmit={handleSubmit} className="title-form">
              <div className="form-group">
                <label htmlFor="name">Nome do Título *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newTitle.name}
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
                  value={newTitle.author}
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
                  value={newTitle.genre}
                  onChange={handleInputChange}
                  placeholder="ex: Ação, Aventura"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="synopsis">Sinopse *</label>
                <textarea
                  id="synopsis"
                  name="synopsis"
                  value={newTitle.synopsis}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalVolumes">Quantidade de Volumes *</label>
                <input
                  type="number"
                  id="totalVolumes"
                  name="totalVolumes"
                  value={newTitle.totalVolumes}
                  onChange={handleInputChange}
                  min="1"
                  max="200"
                  required
                />
              </div>

              <ImageUpload
                label="Capa Principal do Título"
                placeholder="Upload da capa principal"
                preview={newTitle.mainCover?.preview}
                onImageSelect={handleMainCoverSelect}
                required
              />

              <VolumeUploadGrid
                totalVolumes={newTitle.totalVolumes}
                titleName={newTitle.name || 'Título'}
                onVolumesChange={handleVolumesChange}
              />

              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adicionando...' : 'Adicionar Título'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="tab-content">
            <div className="titles-list">
              <h3>Títulos Cadastrados ({titles.length})</h3>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Carregando títulos...</p>
                </div>
              ) : titles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Nenhum título cadastrado ainda.</p>
                  <p>Use a aba "Adicionar Título" para criar o primeiro título.</p>
                </div>
              ) : (
                <div className="titles-grid-admin">
                  {titles.map((title) => (
                    <div key={title.id} className="title-card-admin">
                      <img
                        src={title.coverImage ? `${BASE_URL}${title.coverImage}` : 'https://via.placeholder.com/200x300/3498db/ffffff?text=Sem+Capa'}
                        alt={title.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x300/95a5a6/ffffff?text=Erro+Imagem';
                        }}
                      />
                      <div className="title-info-admin">
                        <h4>{title.name}</h4>
                        <p>Por: {title.author || 'Autor não informado'}</p>
                        <p>Volumes: {title.volumes?.length || 0}</p>
                        <p>Gênero: {title.genre || 'Não informado'}</p>
                        <div className={`title-status status-${title.status?.toLowerCase() || 'ongoing'}`}>
                          {title.status === 'ONGOING' ? 'Em Andamento' :
                           title.status === 'COMPLETED' ? 'Completo' :
                           title.status === 'HIATUS' ? 'Em Hiato' : 'Em Andamento'}
                        </div>
                      </div>
                      <div className="title-actions">
                        <button
                          className="edit-button"
                          onClick={() => handleEditTitle(title)}
                          title="Editar título"
                        >
                          Editar
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => handleDeleteTitle(title.id)}
                          title="Excluir título"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

  </>)
};
export default AdminPanel;
