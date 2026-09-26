import React from 'react';

interface CollectionSkeletonGridProps {
  count?: number;
}

export const CollectionSkeletonGrid: React.FC<CollectionSkeletonGridProps> = ({ count = 6 }) => {
  return (
    <div className="collection-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="collection-skeleton-card">
          <div className="skeleton-media shimmer" />
          <div className="skeleton-details">
            <div className="skeleton-line-sm shimmer" />
            <div className="skeleton-line-lg shimmer" />
            <div className="skeleton-line-md shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};
