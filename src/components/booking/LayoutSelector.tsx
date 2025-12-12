import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StudioLayout } from '@/types/booking';
import { cn } from '@/lib/utils';
import { Users, Check, Image as ImageIcon } from 'lucide-react';

interface LayoutSelectorProps {
  layouts: StudioLayout[];
  selectedLayout: string | null;
  onSelectLayout: (layoutId: string) => void;
}

export function LayoutSelector({ layouts, selectedLayout, onSelectLayout }: LayoutSelectorProps) {
  const [photoGalleryOpen, setPhotoGalleryOpen] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {layouts.map((layout, index) => {
        const isSelected = selectedLayout === layout.id;
        const hasPhotos = (layout.layout_photos?.length || 0) >= 1;
        const photoCount = layout.layout_photos?.length || 0;

        return (
          <Card
            key={layout.id}
            className={cn(
              "overflow-hidden cursor-pointer transition-all hover:shadow-lg",
              isSelected && "ring-2 ring-primary shadow-lg"
            )}
            onClick={() => onSelectLayout(layout.id)}
          >
            {/* Layout Image */}
            <div className="relative aspect-[4/3] bg-muted">
              <img
                src={layout.thumbnail_photo || layout.image || '/placeholder.svg'}
                alt={layout.name}
                className="w-full h-full object-cover"
              />

              {/* Photo Count Badge */}
              {hasPhotos && (
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="bg-black/70 text-white border-0">
                    <ImageIcon className="h-3 w-3 mr-1" />
                    {photoCount}
                  </Badge>
                </div>
              )}

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                  <Check className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Layout Details */}
            <div className="p-6 text-center space-y-3">
              {/* Layout Name */}
              <h3 className="text-2xl font-bold uppercase tracking-tight">
                {layout.name}
              </h3>

              {/* Description */}
              {layout.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {layout.description}
                </p>
              )}

              {/* Price */}
              <div className="py-2">
                <p className="text-lg font-semibold">
                  Price RM{layout.pricePerHour}
                </p>
              </div>

              {/* Capacity */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{layout.capacity} pax</span>
              </div>

              {/* Select Button */}
              <Button
                variant={isSelected ? "default" : "outline"}
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLayout(layout.id);
                }}
              >
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Selected
                  </>
                ) : (
                  'Select Layout'
                )}
              </Button>

              {/* See More Photos Button */}
              {hasPhotos && (
                <Dialog open={photoGalleryOpen === layout.id} onOpenChange={(open) => setPhotoGalleryOpen(open ? layout.id : null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      See More Photos ({photoCount})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{layout.name} - Photo Gallery</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {layout.layout_photos?.map((photoUrl, photoIndex) => (
                        <div key={photoIndex} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                          <img
                            src={photoUrl}
                            alt={`${layout.name} photo ${photoIndex + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => window.open(photoUrl, '_blank')}
                          />
                          {layout.thumbnail_photo === photoUrl && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="default" className="text-xs">
                                Thumbnail
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
