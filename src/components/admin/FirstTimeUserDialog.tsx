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

            // Check if user has completed initial setup
            const { data: userData } = await supabase
                .from('admin_users')
                .select('onboarding_completed, created_at')
                .eq('auth_user_id', user.id)
                .single();

            if (!userData) return;

            // Show dialog if:
            // 1. Onboarding not completed OR
            // 2. Account created recently (within last 5 minutes) and haven't dismissed this dialog
            const isNewUser = !userData.onboarding_completed;
            const hasSeenDialog = localStorage.getItem('firstTimeDialogSeen');

            if (isNewUser && !hasSeenDialog) {
                setShowDialog(true);
            }
        } catch (error) {
            console.error('Error checking first-time user:', error);
        }
    };

    const handleNavigateToSettings = () => {
        localStorage.setItem('firstTimeDialogSeen', 'true');
        setShowDialog(false);
        navigate('/admin/settings');
    };

    const handleDismiss = () => {
        localStorage.setItem('firstTimeDialogSeen', 'true');
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
