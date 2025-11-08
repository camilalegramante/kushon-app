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
  publisherId: string;
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
  const [activeTab, setActiveTab] = useState<'add' | 'manage' | 'publishers'>('add');
  const [newTitle, setNewTitle] = useState<NewTitle>({
    name: '',
    synopsis: '',
    author: '',
    genre: '',
    publisherId: '',
    totalVolumes: 1,
    volumeCovers: [{
      number: 1,
      title: 'Título Vol. 1'
    }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [newPublisherData, setNewPublisherData] = useState({ name: '' });
  const [titles, setTitles] = useState<TitleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [publisherToDelete, setPublisherToDelete] = useState<string | null>(null);
  const [deleteTitleModalOpen, setDeleteTitleModalOpen] = useState(false);
  const [titleToDelete, setTitleToDelete] = useState<TitleResponse | null>(null);

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

      if (!newTitle.publisherId) {
        showToast('Por favor, selecione uma editora', 'error');
        return;
      }

      const formData = new FormData();

      const titleData = {
        name: newTitle.name,
        synopsis: newTitle.synopsis || '',
        author: newTitle.author || '',
        genre: newTitle.genre || '',
        publisherId: newTitle.publisherId,
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
          publisherId: '',
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

  const handleCreatePublisher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPublisherData.name.trim()) {
      showToast('Nome da editora é obrigatório', 'error');
      return;
    }

    try {
      const response = await apiService.createPublisher({
        name: newPublisherData.name
      });

      if (!response.success) {
        throw new Error('Erro ao criar editora');
      }

      const newPublisher = response.data;
      setPublishers(prev => [...prev, newPublisher]);
      setNewPublisherData({ name: '' });
      showToast('Editora criada com sucesso!', 'success');
    } catch (error) {
      showToast(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'error');
    }
  };

  const handleDeleteTitle = (title: TitleResponse) => {
    setTitleToDelete(title);
    setDeleteTitleModalOpen(true);
  };

  const handleConfirmDeleteTitle = async () => {
    if (!titleToDelete) return;

    try {
      const response = await apiService.deleteTitle(titleToDelete.id);

      if (response.success) {
        const titlesResponse = await apiService.getTitles();
        if (titlesResponse.success) {
          setTitles(titlesResponse.data);
        }

        showToast('Título excluído com sucesso!', 'success');
      } else {
        showToast('Erro ao excluir título.', 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteTitleModalOpen(false);
      setTitleToDelete(null);
    }
  };

  const handleConfirmDeletePublisher = async () => {
    if (!publisherToDelete) return;

    try {
      const response = await apiService.deletePublisher(publisherToDelete);

      if (response.success) {
        setPublishers(prev => prev.filter(p => p.id !== publisherToDelete));
        showToast('Editora excluída com sucesso!', 'success');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showToast(errorMessage, 'error');
    } finally {
      setDeleteModalOpen(false);
      setPublisherToDelete(null);
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
          <button
            className={`tab-button ${activeTab === 'publishers' ? 'active' : ''}`}
            onClick={() => setActiveTab('publishers')}
          >
            Gerenciar Editoras
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
                <label htmlFor="publisherId">Editora * <small style={{ color: '#666' }}>(Crie novas na aba "Gerenciar Editoras")</small></label>
                <select
                  id="publisherId"
                  name="publisherId"
                  value={newTitle.publisherId}
                  onChange={(e) => setNewTitle(prev => ({ ...prev, publisherId: e.target.value }))}
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
                          onClick={() => handleDeleteTitle(title)}
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

        {activeTab === 'publishers' && (
          <div className="tab-content">
            <div className="publishers-section">
              <h3>Gerenciar Editoras</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>
                <div>
                  <h4>Adicionar Nova Editora</h4>
                  <form onSubmit={handleCreatePublisher}>
                    <div className="form-group">
                      <label htmlFor="publisherNameInput">Nome da Editora *</label>
                      <input
                        type="text"
                        id="publisherNameInput"
                        value={newPublisherData.name}
                        onChange={(e) => setNewPublisherData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ex: Panini"
                        required
                      />
                    </div>
                    <button type="submit" style={{ padding: '10px 20px' }}>
                      Criar Editora
                    </button>
                  </form>
                </div>

                <div>
                  <h4>Editoras Cadastradas ({publishers.length})</h4>
                  {publishers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '2rem', border: '1px dashed #ddd', borderRadius: '4px' }}>
                      Nenhuma editora cadastrada ainda.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                      {publishers.map(pub => (
                        <div
                          key={pub.id}
                          style={{
                            border: '1px solid #ddd',
                            padding: '12px',
                            borderRadius: '4px',
                            backgroundColor: '#f9f9f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <h5 style={{ margin: '0', flex: 1 }}>{pub.name}</h5>
                          <button
                            onClick={() => {
                              setPublisherToDelete(pub.id);
                              setDeleteModalOpen(true);
                            }}
                            style={{
                              background: '#ff4444',
                              color: 'white',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              marginLeft: '10px'
                            }}
                            title="Excluir editora"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '400px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Confirmar Exclusão</h3>
              <p style={{ marginBottom: '20px', color: '#333' }}>
                Tem certeza que deseja excluir esta editora? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setPublisherToDelete(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ccc',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeletePublisher}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTitleModalOpen && titleToDelete && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '400px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Confirmar Exclusão</h3>
              <p style={{ marginBottom: '10px', color: '#333' }}>
                Tem certeza que deseja excluir o título <strong>{titleToDelete.name}</strong>?
              </p>
              <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
                Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setDeleteTitleModalOpen(false);
                    setTitleToDelete(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ccc',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteTitle}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}

  </>)
};
export default AdminPanel;
