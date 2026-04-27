import { useState } from "react";
import { ActivityPhoto } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Image as ImageIcon } from "lucide-react";

interface PhotoGalleryProps {
  photos: ActivityPhoto[];
  onAddPhoto?: (url: string, caption?: string) => void;
  isAdmin?: boolean;
}

export const PhotoGallery = ({ photos, onAddPhoto, isAdmin }: PhotoGalleryProps) => {
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ActivityPhoto | null>(null);

  const handleAddPhoto = () => {
    if (newPhotoUrl.trim() && onAddPhoto) {
      onAddPhoto(newPhotoUrl.trim(), newPhotoCaption.trim() || undefined);
      setNewPhotoUrl("");
      setNewPhotoCaption("");
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Photo Gallery ({photos.length})
        </h3>
        {isAdmin && onAddPhoto && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Photo
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-muted/30 p-4 rounded-lg space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">Photo URL</label>
            <input
              type="url"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
              placeholder="Enter image URL..."
              className="w-full mt-1 p-2 border border-border rounded-md bg-background text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Caption (optional)</label>
            <input
              type="text"
              value={newPhotoCaption}
              onChange={(e) => setNewPhotoCaption(e.target.value)}
              placeholder="Enter caption..."
              className="w-full mt-1 p-2 border border-border rounded-md bg-background text-foreground"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddPhoto} disabled={!newPhotoUrl.trim()}>
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div 
                key={photo.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Activity photo"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
                  }}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm">View</span>
                </div>
              </div>
            ))}
          </div>

          {/* Lightbox Modal */}
          {selectedPhoto && (
            <div 
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div 
                className="relative max-w-4xl w-full bg-background rounded-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                  onClick={() => setSelectedPhoto(null)}
                >
                  ✕
                </button>
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || "Activity photo"}
                  className="w-full h-auto max-h-[70vh] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
                  }}
                />
                {selectedPhoto.caption && (
                  <div className="p-4 border-t">
                    <p className="text-foreground">{selectedPhoto.caption}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Uploaded on {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg">
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No photos yet</p>
          {isAdmin && onAddPhoto && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Photo
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

// Simple photo gallery modal for viewing photos in a carousel
interface PhotoCarouselProps {
  photos: ActivityPhoto[];
}

export const PhotoCarousel = ({ photos }: PhotoCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  if (photos.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-center bg-black min-h-[400px] rounded-lg overflow-hidden">
        <img
          src={photos[currentIndex].url}
          alt={photos[currentIndex].caption || "Activity photo"}
          className="max-w-full max-h-[400px] object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
          }}
        />
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
          >
            ←
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
          >
            →
          </button>
        </>
      )}

      <div className="p-4 border-t mt-2">
        <p className="text-foreground font-medium">
          {photos[currentIndex].caption || "No caption"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {currentIndex + 1} of {photos.length}
        </p>
      </div>
    </div>
  );
};

