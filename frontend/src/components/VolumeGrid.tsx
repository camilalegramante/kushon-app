import { useState } from 'react';
import type { Volume } from '../data/mockTitles';
import './VolumeGrid.css';

interface VolumeGridProps {
  volumes: Volume[];
  onVolumeToggle: (volumeNumber: number) => void;
}

const VolumeGrid = ({ volumes, onVolumeToggle }: VolumeGridProps) => {
  const [_hoveredVolume, setHoveredVolume] = useState<number | null>(null);

  return (
    <div className="volume-grid-section">
      <h3>Volumes Disponíveis</h3>
      <div className="volume-grid">
        {volumes.map((volume) => (
          <div
            key={volume.number}
            className={`volume-item ${volume.owned ? 'owned' : 'not-owned'}`}
            onClick={() => onVolumeToggle(volume.number)}
            onMouseEnter={() => setHoveredVolume(volume.number)}
            onMouseLeave={() => setHoveredVolume(null)}
          >
            <div className="volume-cover">
              <img src={volume.cover} alt={volume.title} />
              <div className="volume-overlay">
                <div className="volume-status">
                  {volume.owned ? (
                    <span className="remove-icon">×</span>
                  ) : (
                    <span className="add-icon">+</span>
                  )}
                </div>
              </div>
              {volume.owned && (
                <div className="volume-badge">
                  Adicionado
                </div>
              )}
            </div>
            <div className="volume-info">
              <span className="volume-number">Vol. {volume.number}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VolumeGrid;