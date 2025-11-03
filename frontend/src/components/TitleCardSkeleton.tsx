import Skeleton from './Skeleton';
import './Skeleton.css';

const TitleCardSkeleton = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image" />
      <div className="skeleton-content">
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-subtitle" />
        <Skeleton className="skeleton-progress" />
      </div>
    </div>
  );
};

export default TitleCardSkeleton;