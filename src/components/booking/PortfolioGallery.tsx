import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEffect, useRef, useState } from 'react';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import 'photoswipe/style.css';

interface PortfolioGalleryProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    photos: string[];
    studioName?: string;
}

interface PhotoDimensions {
    width: number;
    height: number;
}

export const PortfolioGallery = ({
    open,
    onOpenChange,
    photos,
    studioName = 'Studio'
}: PortfolioGalleryProps) => {
    const galleryRef = useRef<HTMLDivElement>(null);
    const [photoDimensions, setPhotoDimensions] = useState<PhotoDimensions[]>([]);

    // Load actual image dimensions
    useEffect(() => {
        if (photos.length === 0) return;

        const loadDimensions = async () => {
            const dimensions = await Promise.all(
                photos.map((url) => {
                    return new Promise<PhotoDimensions>((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            resolve({ width: img.naturalWidth, height: img.naturalHeight });
                        };
                        img.onerror = () => {
                            // Fallback dimensions if image fails to load
                            resolve({ width: 1200, height: 1200 });
                        };
                        img.src = url;
                    });
                })
            );
            setPhotoDimensions(dimensions);
        };

        loadDimensions();
    }, [photos]);

    useEffect(() => {
        if (!open || photos.length === 0 || photoDimensions.length === 0) return;

        let lightbox: PhotoSwipeLightbox | null = null;

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            lightbox = new PhotoSwipeLightbox({
                gallery: '#portfolio-gallery',
                children: 'a',
                pswpModule: () => import('photoswipe'),
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                bgOpacity: 0.95,
                showHideAnimationType: 'zoom',
                // Prevent closing the dialog when PhotoSwipe closes
                closeOnVerticalDrag: false,
                pinchToClose: false,
                // Keep original image size
                initialZoomLevel: 'fit',
                secondaryZoomLevel: 1, // 100% = original size
                maxZoomLevel: 2,
                // Enable navigation arrows
                arrowPrev: true,
                arrowNext: true,
                // Show UI controls
                zoom: true,
                close: true,
                counter: true,
            });

            // When PhotoSwipe closes, keep the dialog open
            lightbox.on('close', () => {
                // Do nothing - keep the gallery dialog open
            });

            lightbox.init();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (lightbox) {
                lightbox.destroy();
            }
        };
    }, [open, photos, photoDimensions]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto rounded-none">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {studioName} - Portfolio Gallery
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                    </p>
                </DialogHeader>

                {photos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No portfolio photos available</p>
                    </div>
                ) : (
                    <div
                        id="portfolio-gallery"
                        ref={galleryRef}
                        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6"
                    >
                        {photos.map((photoUrl, index) => {
                            const dimensions = photoDimensions[index] || { width: 1200, height: 1200 };

                            return (
                                <a
                                    key={index}
                                    href={photoUrl}
                                    data-pswp-width={dimensions.width}
                                    data-pswp-height={dimensions.height}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative aspect-square overflow-hidden bg-muted group cursor-pointer block"
                                >
                                    <img
                                        src={photoUrl}
                                        alt={`Portfolio photo ${index + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                        <svg
                                            className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                            />
                                        </svg>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
