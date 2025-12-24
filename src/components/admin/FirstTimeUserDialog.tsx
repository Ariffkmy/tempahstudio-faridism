import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function FirstTimeUserDialog() {
    const [showDialog, setShowDialog] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkFirstTimeUser();
    }, []);

    const checkFirstTimeUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) return;

            // Check if user has already seen the dialog in this session
            const hasSeenDialogThisSession = sessionStorage.getItem('firstTimeDialogSeen');
            if (hasSeenDialogThisSession) {
                return;
            }

            // Check if user has completed initial setup
            const { data: userData } = await supabase
                .from('admin_users')
                .select('onboarding_completed, created_at, studio_id')
                .eq('auth_user_id', user.id)
                .single();

            if (!userData) return;

            // If onboarding is not completed, always show the dialog
            if (!userData.onboarding_completed) {
                setShowDialog(true);
                return;
            }

            // If onboarding is completed, check if ALL required studio settings are complete
            if (userData.studio_id) {
                const { data: studioData } = await supabase
                    .from('studios')
                    .select('name, location, phone, email, time_slot_gap, operating_start_time, operating_end_time, payment_studio_enabled, payment_qr_enabled, payment_bank_transfer_enabled, payment_fpx_enabled, payment_tng_enabled')
                    .eq('id', userData.studio_id)
                    .single();

                // Also check if there's at least one layout
                const { data: layouts } = await supabase
                    .from('studio_layouts')
                    .select('id')
                    .eq('studio_id', userData.studio_id);

                if (studioData) {
                    // Check all required fields from the Konfigurasi Wajib checklist:
                    // 1. Basic Info: name, email, phone, location
                    const hasBasicInfo = !!(studioData.name && studioData.email && studioData.phone && studioData.location);

                    // 2. Packages: at least one layout
                    const hasPackages = layouts && layouts.length > 0;

                    // 3. Booking Form: time_slot_gap and at least one payment method
                    const hasPaymentMethod = !!(
                        studioData.payment_studio_enabled ||
                        studioData.payment_qr_enabled ||
                        studioData.payment_bank_transfer_enabled ||
                        studioData.payment_fpx_enabled ||
                        studioData.payment_tng_enabled
                    );
                    const hasBookingForm = !!(studioData.time_slot_gap && hasPaymentMethod);

                    // 4. Operating Hours: start and end time
                    const hasOperatingHours = !!(studioData.operating_start_time && studioData.operating_end_time);

                    // Show dialog if ANY of the required configurations is incomplete
                    const hasIncompleteSettings = !hasBasicInfo || !hasPackages || !hasBookingForm || !hasOperatingHours;

                    if (hasIncompleteSettings) {
                        setShowDialog(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking first-time user:', error);
        }
    };

    const handleNavigateToSettings = () => {
        sessionStorage.setItem('firstTimeDialogSeen', 'true');
        setShowDialog(false);
        navigate('/admin/settings');
    };

    const handleDismiss = () => {
        sessionStorage.setItem('firstTimeDialogSeen', 'true');
        setShowDialog(false);
    };

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="space-y-4">
                    <div className="flex justify-center">
                        <div className="p-4">
                            <img
                                src="/tempahstudiologo.png"
                                alt="Raya Studio Logo"
                                className="h-16 w-auto"
                            />
                        </div>
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center">
                        Selamat Datang!
                    </DialogTitle>
                    <DialogDescription className="text-center space-y-3">
                        <p className="text-base">
                            Terima kasih kerana menyertai platform Tempah Studio.
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <p className="font-semibold text-foreground">
                                Sila kemaskini maklumat akaun dan studio anda di bahagian tetapan
                            </p>
                            <p className="text-sm">
                                Lengkapkan profil studio anda untuk memberikan pengalaman terbaik kepada pelanggan.
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 mt-4">
                    <Button
                        onClick={handleNavigateToSettings}
                        size="lg"
                        className="w-full"
                    >
                        <Settings className="h-4 w-4 mr-2" />
                        Kemaskini Sekarang
                    </Button>
                    <Button
                        onClick={handleDismiss}
                        variant="ghost"
                        size="lg"
                        className="w-full"
                    >
                        Nanti
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
