import { useState, useEffect } from 'react';
import ImageUpload from './ImageUpload';
import './VolumeUploadGrid.css';

interface VolumeUpload {
  id?: string;
  number: number;
  title: string;
  file?: File;
  preview?: string;
  existingImage?: string;
}

interface VolumeUploadGridProps {
  totalVolumes: number;
  titleName: string;
  onVolumesChange: (volumes: VolumeUpload[]) => void;
  existingVolumes?: VolumeUpload[];
}

const VolumeUploadGrid = ({ totalVolumes, titleName, onVolumesChange, existingVolumes = [] }: VolumeUploadGridProps) => {
  const [volumes, setVolumes] = useState<VolumeUpload[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      if (existingVolumes.length > 0) {
        setVolumes(existingVolumes);
      } else {
        const initialVolumes = Array.from({ length: totalVolumes }, (_, i) => ({
          number: i + 1,
          title: `${titleName} Vol. ${i + 1}`
        }));
        setVolumes(initialVolumes);
      }
      setInitialized(true);
    }
  }, [existingVolumes, totalVolumes, titleName, initialized]);

  useEffect(() => {
    if (initialized && volumes.length !== totalVolumes) {
      const newVolumes = Array.from({ length: totalVolumes }, (_, i) => {
        const existingVolume = volumes.find(v => v.number === i + 1);
        return existingVolume || {
          number: i + 1,
          title: `${titleName} Vol. ${i + 1}`
        };
      });
      setVolumes(newVolumes);
    }
  }, [totalVolumes, titleName, initialized]);

  useEffect(() => {
    if (initialized) {
      onVolumesChange(volumes);
    }
  }, [volumes, initialized]);

  const handleVolumeImageSelect = (volumeNumber: number, file: File, preview: string) => {
    setVolumes(prevVolumes =>
      prevVolumes.map(vol =>
        vol.number === volumeNumber
          ? { ...vol, file, preview }
          : vol
      )
    );
  };

  const uploadedCount = volumes.filter(v => v.preview || v.existingImage).length;

  return (
    <div className="volume-upload-section">
      <div className="volume-upload-header">
        <h4>Upload das Capas dos Volumes</h4>
        <span className="upload-counter">
          {uploadedCount} de {totalVolumes} capas enviadas
        </span>
      </div>
      
      <div className="volume-upload-grid">
        {volumes.map((volume) => (
          <div key={volume.number} className="volume-upload-item">
            <h5>Volume {volume.number}</h5>
            <ImageUpload
              label=""
              placeholder="Capa do volume"
              preview={volume.preview}
              existingImage={volume.existingImage}
              onImageSelect={(file, preview) => handleVolumeImageSelect(volume.number, file, preview)}
            />
            {volume.id && (
              <small className="existing-volume">Volume existente</small>
            )}
          </div>
        ))}
      </div>
      
      {uploadedCount < totalVolumes && (
        <div className="upload-warning">
          <p>⚠️ {totalVolumes - uploadedCount} volume{totalVolumes - uploadedCount > 1 ? 's' : ''} ainda sem capa</p>
          <p className="upload-hint">Você pode adicionar capas individuais para cada volume</p>
        </div>
      )}
    </div>
  );
};

export default VolumeUploadGrid;