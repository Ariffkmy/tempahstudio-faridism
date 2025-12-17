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
    <div className="max-w-lg mx-auto">
      <div className="grid grid-cols-1 gap-6">
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
              <div className="p-6 space-y-4">
                {/* Layout Name */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold uppercase tracking-tight">
                    {layout.name}
                  </h3>
                  {/* Description */}
                  {layout.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {layout.description}
                    </p>
                  )}
                </div>

                {/* Info Grid - Price, Duration, Capacity */}
                <div className="grid grid-cols-3 gap-3 py-3 border-y">
                  {/* Price */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Harga</p>
                    <p className="text-lg font-bold text-primary">
                      RM{layout.pricePerHour}
                    </p>
                  </div>

                  {/* Duration Package */}
                  <div className="text-center border-x">
                    <p className="text-xs text-muted-foreground mb-1">Tempoh</p>
                    <p className="text-lg font-bold">
                      {layout.minute_package || 60}
                      <span className="text-sm font-normal text-muted-foreground ml-1">minit</span>
                    </p>
                  </div>

                  {/* Capacity */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Kapasiti</p>
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-lg font-bold">{layout.capacity}</p>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                {layout.amenities && layout.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {layout.amenities.slice(0, 3).map((amenity, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {layout.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{layout.amenities.length - 3} lagi
                      </Badge>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {/* Select Button */}
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="w-full"
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLayout(layout.id);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Dipilih
                      </>
                    ) : (
                      'Pilih Layout Ini'
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
                          Lihat Foto ({photoCount})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{layout.name} - Galeri Foto</DialogTitle>
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
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
