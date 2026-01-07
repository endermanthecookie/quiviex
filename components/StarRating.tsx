
import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  totalRatings?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  size?: number;
  showCount?: boolean;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  totalRatings = 0, 
  interactive = false, 
  onRate,
  size = 16,
  showCount = true,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div 
        className="flex" 
        onMouseLeave={() => interactive && setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onRate && onRate(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            <Star 
              size={size} 
              className={`${
                star <= Math.round(displayRating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-slate-200 text-slate-200'
              }`} 
            />
          </button>
        ))}
      </div>
      {showCount && !interactive && totalRatings > 0 && (
        <span className="text-xs text-slate-500 font-bold ml-1">
          ({totalRatings})
        </span>
      )}
    </div>
  );
};
