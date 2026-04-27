import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Rating({ rating, onRate, readonly = false, size = "md" }: RatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };
  
  const handleClick = (value: number) => {
    if (!readonly && onRate) {
      onRate(value);
      toast.success(`Rated ${value} stars!`);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={readonly}
          onClick={() => handleClick(value)}
          onMouseEnter={() => !readonly && setHoverRating(value)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          aria-label={`Rate ${value} stars`}
          className={`transition-transform ${!readonly && "hover:scale-110"} ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              value <= (hoverRating || rating)
                ? "fill-yellow-500 text-yellow-500"
                : "fill-muted text-muted"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

interface RatingSummaryProps {
  ratings: { userId: string; score: number; createdAt: string }[];
}

export function RatingSummary({ ratings }: RatingSummaryProps) {
  if (ratings.length === 0) {
    return <p className="text-sm text-muted-foreground">No ratings yet</p>;
  }
  
  const average = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
  
  return (
    <div className="flex items-center gap-2">
      <Rating rating={Math.round(average)} readonly size="sm" />
      <span className="text-sm text-muted-foreground">
        {average.toFixed(1)} ({ratings.length} {ratings.length === 1 ? "review" : "reviews"})
      </span>
    </div>
  );
}
