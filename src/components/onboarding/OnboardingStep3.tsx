import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingStep3Props {
    onComplete: () => void;
}

interface Layout {
    id: string;
    name: string;
    description: string;
    capacity: number;
    price_per_hour: number;
    layout_photos?: string[];
    thumbnail_photo?: string;
}

export default function OnboardingStep3({ onComplete }: OnboardingStep3Props) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [layouts, setLayouts] = useState<Layout[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState<{ [key: string]: boolean }>({});

    // Load existing layouts
    useEffect(() => {
        const loadLayouts = async () => {
            if (!user?.studio_id) return;

            const { data, error } = await supabase
                .from('studio_layouts')
                .select('*')
                .eq('studio_id', user.studio_id)
                .order('created_at', { ascending: true });

            if (data && !error) {
                setLayouts(data.map(layout => ({
                    id: layout.id,
                    name: layout.name,
                    description: layout.description || '',
                    capacity: layout.capacity || 1,
                    price_per_hour: layout.price_per_hour || 100,
                    layout_photos: layout.layout_photos || [],
                    thumbnail_photo: layout.thumbnail_photo || '',
                })));
            }
        };

        loadLayouts();
    }, [user?.studio_id]);

    const handleAddLayout = () => {
        const newLayout: Layout = {
            id: `temp-${Date.now()}`,
            name: '',
            description: '',
            capacity: 1,
            price_per_hour: 100,
            layout_photos: [],
            thumbnail_photo: '',
        };
        setLayouts([...layouts, newLayout]);
    };

    const handleRemoveLayout = (index: number) => {
        setLayouts(layouts.filter((_, i) => i !== index));
    };

    const handleLayoutChange = (index: number, field: keyof Layout, value: string | number | string[]) => {
        const updatedLayouts = [...layouts];
        updatedLayouts[index] = { ...updatedLayouts[index], [field]: value };
        setLayouts(updatedLayouts);
    };

    const handlePhotoUpload = async (index: number, file: File) => {
        const layout = layouts[index];
        if (!layout || !user?.studio_id) return;

        // Check if already have 5 photos
        const currentPhotos = layout.layout_photos || [];
        if (currentPhotos.length >= 5) {
            toast({
                title: 'Maksimum foto dicapai',
                description: 'Anda hanya boleh muat naik sehingga 5 foto setiap pakej',
                variant: 'destructive',
            });
            return;
        }

        setUploadingPhoto(prev => ({ ...prev, [layout.id]: true }));
        try {
            const { uploadLayoutPhoto } = await import('@/services/fileUploadService');
            const result = await uploadLayoutPhoto(file, layout.id, user.studio_id);

            if (result.success && result.url) {
                const updatedPhotos = [...currentPhotos, result.url];
                handleLayoutChange(index, 'layout_photos', updatedPhotos);

                // If this is the first photo, set it as thumbnail
                if (!layout.thumbnail_photo) {
                    handleLayoutChange(index, 'thumbnail_photo', result.url);
                }

                toast({
                    title: 'Foto dimuat naik',
                    description: 'Foto pakej berjaya dimuat naik',
                });
            } else {
                toast({
                    title: 'Muat naik gagal',
                    description: result.error || 'Gagal memuat naik foto',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Layout photo upload error:', error);
            toast({
                title: 'Ralat',
                description: 'Gagal memuat naik foto',
                variant: 'destructive',
            });
        } finally {
            setUploadingPhoto(prev => ({ ...prev, [layout.id]: false }));
        }
    };

    const handleDeletePhoto = (index: number, photoUrl: string) => {
        const layout = layouts[index];
        const updatedPhotos = (layout.layout_photos || []).filter(url => url !== photoUrl);
        handleLayoutChange(index, 'layout_photos', updatedPhotos);

        // If deleted photo was thumbnail, set first remaining photo as thumbnail
        if (layout.thumbnail_photo === photoUrl) {
            handleLayoutChange(index, 'thumbnail_photo', updatedPhotos[0] || '');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user?.studio_id) {
            toast({
                title: 'Ralat',
                description: 'Studio ID tidak dijumpai',
                variant: 'destructive',
            });
            return;
        }

        // Validate at least one layout
        if (layouts.length === 0) {
            toast({
                title: 'Ralat',
                description: 'Sila tambah sekurang-kurangnya satu pakej',
                variant: 'destructive',
            });
            return;
        }

        // Validate all layouts have names
        const invalidLayout = layouts.find(l => !l.name.trim());
        if (invalidLayout) {
            toast({
                title: 'Ralat',
                description: 'Sila isi nama untuk semua pakej',
                variant: 'destructive',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Delete existing layouts for this studio
            await supabase
                .from('studio_layouts')
                .delete()
                .eq('studio_id', user.studio_id);

            // Insert new layouts
            const layoutsToInsert = layouts.map(layout => ({
                studio_id: user.studio_id,
                name: layout.name,
                description: layout.description,
                capacity: layout.capacity,
                price_per_hour: layout.price_per_hour,
                layout_photos: layout.layout_photos || [],
                thumbnail_photo: layout.thumbnail_photo || '',
                is_active: true,
            }));

            const { error } = await supabase
                .from('studio_layouts')
                .insert(layoutsToInsert);

            if (error) throw error;

            toast({
                title: 'Berjaya!',
                description: 'Pakej telah disimpan',
            });
            onComplete();
        } catch (error) {
            console.error('Error saving layouts:', error);
            toast({
                title: 'Ralat',
                description: 'Gagal menyimpan pakej',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {layouts.map((layout, index) => (
                    <Card key={layout.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-lg">Pakej {index + 1}</CardTitle>
                            {layouts.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveLayout(index)}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Layout Name */}
                            <div className="space-y-2">
                                <Label htmlFor={`name-${index}`}>Nama Pakej *</Label>
                                <Input
                                    id={`name-${index}`}
                                    value={layout.name}
                                    onChange={(e) => handleLayoutChange(index, 'name', e.target.value)}
                                    placeholder="Contoh: Studio Kecil"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor={`description-${index}`}>Perihal</Label>
                                <Textarea
                                    id={`description-${index}`}
                                    value={layout.description}
                                    onChange={(e) => handleLayoutChange(index, 'description', e.target.value)}
                                    placeholder="Perihalkan pakej ini..."
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Capacity */}
                                <div className="space-y-2">
                                    <Label htmlFor={`capacity-${index}`}>Kapasiti</Label>
                                    <Input
                                        id={`capacity-${index}`}
                                        type="number"
                                        min="1"
                                        value={layout.capacity}
                                        onChange={(e) => handleLayoutChange(index, 'capacity', parseInt(e.target.value) || 1)}
                                    />
                                </div>

                                {/* Price */}
                                <div className="space-y-2">
                                    <Label htmlFor={`price-${index}`}>Harga (RM/jam)</Label>
                                    <Input
                                        id={`price-${index}`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={layout.price_per_hour}
                                        onChange={(e) => handleLayoutChange(index, 'price_per_hour', parseFloat(e.target.value) || 0)}
                                    />
                                </div>
                            </div>

                            {/* Photo Upload Section */}
                            <div className="space-y-2">
                                <Label>Foto Pakej (Maksimum 5)</Label>
                                <div className="space-y-3">
                                    {/* Photo Grid */}
                                    {layout.layout_photos && layout.layout_photos.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            {layout.layout_photos.map((photoUrl, photoIndex) => (
                                                <div key={photoIndex} className="relative group">
                                                    <img
                                                        src={photoUrl}
                                                        alt={`Foto ${photoIndex + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg border"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() => handleDeletePhoto(index, photoUrl)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Button */}
                                    {(!layout.layout_photos || layout.layout_photos.length < 5) && (
                                        <div>
                                            <Input
                                                id={`photo-${index}`}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        handlePhotoUpload(index, file);
                                                        e.target.value = ''; // Reset input
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => document.getElementById(`photo-${index}`)?.click()}
                                                disabled={uploadingPhoto[layout.id]}
                                                className="w-full"
                                            >
                                                <Upload className="h-4 w-4 mr-2" />
                                                {uploadingPhoto[layout.id] ? 'Memuat naik...' : 'Muat Naik Foto'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Format: JPG, PNG (Maks 10MB setiap foto)
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Add Layout Button */}
            <Button
                type="button"
                variant="outline"
                onClick={handleAddLayout}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pakej
            </Button>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Menyimpan...' : 'Simpan & Teruskan'}
            </Button>
        </form>
    );
}
