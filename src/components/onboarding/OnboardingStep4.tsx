import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OnboardingStep4Props {
    onComplete: () => void;
}

export default function OnboardingStep4({ onComplete }: OnboardingStep4Props) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [operatingHours, setOperatingHours] = useState({
        startTime: '09:00',
        endTime: '18:00',
    });

    const [breakTime, setBreakTime] = useState({
        startTime: '13:00',
        endTime: '14:00',
    });

    // Load existing operating hours
    useEffect(() => {
        const loadOperatingHours = async () => {
            if (!user?.studio_id) return;

            const { data, error } = await supabase
                .from('studios')
                .select('operating_start_time, operating_end_time, break_start_time, break_end_time')
                .eq('id', user.studio_id)
                .single();

            if (data && !error) {
                setOperatingHours({
                    startTime: data.operating_start_time || '09:00',
                    endTime: data.operating_end_time || '18:00',
                });
                setBreakTime({
                    startTime: data.break_start_time || '13:00',
                    endTime: data.break_end_time || '14:00',
                });
            }
        };

        loadOperatingHours();
    }, [user?.studio_id]);

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
                operating_start_time: operatingHours.startTime,
                operating_end_time: operatingHours.endTime,
                break_start_time: breakTime.startTime,
                break_end_time: breakTime.endTime,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.studio_id);

        setIsSubmitting(false);

        if (error) {
            toast({
                title: 'Ralat',
                description: 'Gagal menyimpan waktu operasi',
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Tahniah!',
                description: 'Setup selesai! Anda akan dibawa ke papan pemuka.',
            });
            onComplete();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Operating Hours */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Waktu Operasi
                    </CardTitle>
                    <CardDescription>
                        Tetapkan waktu operasi harian studio anda
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Time */}
                        <div className="space-y-2">
                            <Label htmlFor="operatingStartTime">Masa Mula</Label>
                            <Input
                                id="operatingStartTime"
                                type="time"
                                value={operatingHours.startTime}
                                onChange={(e) => setOperatingHours(prev => ({ ...prev, startTime: e.target.value }))}
                                required
                            />
                        </div>

                        {/* End Time */}
                        <div className="space-y-2">
                            <Label htmlFor="operatingEndTime">Masa Tamat</Label>
                            <Input
                                id="operatingEndTime"
                                type="time"
                                value={operatingHours.endTime}
                                onChange={(e) => setOperatingHours(prev => ({ ...prev, endTime: e.target.value }))}
                                required
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Break Time */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Waktu Rehat
                    </CardTitle>
                    <CardDescription>
                        Tetapkan waktu rehat (jika ada)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Break Start Time */}
                        <div className="space-y-2">
                            <Label htmlFor="breakStartTime">Masa Mula Rehat</Label>
                            <Input
                                id="breakStartTime"
                                type="time"
                                value={breakTime.startTime}
                                onChange={(e) => setBreakTime(prev => ({ ...prev, startTime: e.target.value }))}
                            />
                        </div>

                        {/* Break End Time */}
                        <div className="space-y-2">
                            <Label htmlFor="breakEndTime">Masa Tamat Rehat</Label>
                            <Input
                                id="breakEndTime"
                                type="time"
                                value={breakTime.endTime}
                                onChange={(e) => setBreakTime(prev => ({ ...prev, endTime: e.target.value }))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Menyimpan...' : 'Selesai & Pergi ke Papan Pemuka'}
            </Button>
        </form>
    );
}
