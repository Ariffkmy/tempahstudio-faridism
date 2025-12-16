import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MapPin, Mail, Phone } from 'lucide-react';

interface OnboardingStep2Props {
    onComplete: () => void;
}

export default function OnboardingStep2({ onComplete }: OnboardingStep2Props) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        studioName: '',
        studioLocation: '',
        googleMapsLink: '',
        wazeLink: '',
        ownerName: '',
        ownerPhone: '',
        studioEmail: '',
        studioPhone: '',
    });

    // Load existing studio data
    useEffect(() => {
        const loadStudioData = async () => {
            if (!user?.studio_id) return;

            const { data, error } = await supabase
                .from('studios')
                .select('*')
                .eq('id', user.studio_id)
                .single();

            if (data && !error) {
                setFormData({
                    studioName: data.name || '',
                    studioLocation: data.location || '',
                    googleMapsLink: data.google_maps_link || '',
                    wazeLink: data.waze_link || '',
                    ownerName: data.owner_name || '',
                    ownerPhone: data.owner_phone || '',
                    studioEmail: data.email || '',
                    studioPhone: data.phone || '',
                });
            }
        };

        loadStudioData();
    }, [user?.studio_id]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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

        setIsSubmitting(true);

        const { error } = await supabase
            .from('studios')
            .update({
                name: formData.studioName,
                location: formData.studioLocation,
                google_maps_link: formData.googleMapsLink,
                waze_link: formData.wazeLink,
                owner_name: formData.ownerName,
                owner_phone: formData.ownerPhone,
                email: formData.studioEmail,
                phone: formData.studioPhone,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.studio_id);

        setIsSubmitting(false);

        if (error) {
            toast({
                title: 'Ralat',
                description: 'Gagal menyimpan maklumat studio',
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Berjaya!',
                description: 'Maklumat studio telah disimpan',
            });
            onComplete();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Studio Name */}
            <div className="space-y-2">
                <Label htmlFor="studioName">Nama Studio *</Label>
                <Input
                    id="studioName"
                    value={formData.studioName}
                    onChange={(e) => handleChange('studioName', e.target.value)}
                    placeholder="Studio Fotografi ABC"
                    required
                />
            </div>

            {/* Studio Location */}
            <div className="space-y-2">
                <Label htmlFor="studioLocation">Lokasi Studio</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="studioLocation"
                        value={formData.studioLocation}
                        onChange={(e) => handleChange('studioLocation', e.target.value)}
                        placeholder="Kuala Lumpur, Malaysia"
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Google Maps Link */}
            <div className="space-y-2">
                <Label htmlFor="googleMapsLink">Pautan Google Maps</Label>
                <Input
                    id="googleMapsLink"
                    type="url"
                    value={formData.googleMapsLink}
                    onChange={(e) => handleChange('googleMapsLink', e.target.value)}
                    placeholder="https://maps.google.com/..."
                />
            </div>

            {/* Waze Link */}
            <div className="space-y-2">
                <Label htmlFor="wazeLink">Pautan Waze</Label>
                <Input
                    id="wazeLink"
                    type="url"
                    value={formData.wazeLink}
                    onChange={(e) => handleChange('wazeLink', e.target.value)}
                    placeholder="https://waze.com/..."
                />
            </div>

            {/* Owner Name */}
            <div className="space-y-2">
                <Label htmlFor="ownerName">Nama Pemilik</Label>
                <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    placeholder="Ahmad bin Abdullah"
                />
            </div>

            {/* Owner Phone */}
            <div className="space-y-2">
                <Label htmlFor="ownerPhone">No. Telefon Pemilik</Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="ownerPhone"
                        type="tel"
                        value={formData.ownerPhone}
                        onChange={(e) => handleChange('ownerPhone', e.target.value)}
                        placeholder="+60123456789"
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Studio Email */}
            <div className="space-y-2">
                <Label htmlFor="studioEmail">Email Studio</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="studioEmail"
                        type="email"
                        value={formData.studioEmail}
                        onChange={(e) => handleChange('studioEmail', e.target.value)}
                        placeholder="studio@example.com"
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Studio Phone */}
            <div className="space-y-2">
                <Label htmlFor="studioPhone">No. Telefon Studio</Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="studioPhone"
                        type="tel"
                        value={formData.studioPhone}
                        onChange={(e) => handleChange('studioPhone', e.target.value)}
                        placeholder="+60123456789"
                        className="pl-10"
                    />
                </div>
            </div>

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
