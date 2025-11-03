import './Skeleton.css';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

const Skeleton = ({ className = '', width, height }: SkeletonProps) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
};

export default Skeleton;