import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Mail, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OnboardingStep5Props {
    onComplete: () => void;
}

export default function OnboardingStep5({ onComplete }: OnboardingStep5Props) {
    const { toast } = useToast();
    const [userEmail, setUserEmail] = useState('');
    const [emailSent, setEmailSent] = useState(true); // Email already sent during registration
    const [isSending, setIsSending] = useState(false);
    const [isResending, setIsResending] = useState(false);

    // Get user email on mount
    useEffect(() => {
        const getUserEmail = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }
        };
        getUserEmail();
    }, []);

    // Mark onboarding as complete when reaching Step 5
    useEffect(() => {
        markOnboardingComplete();
    }, []);

    const handleSendVerificationEmail = async () => {
        setIsSending(true);

        try {
            // Resend verification email using Supabase
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: userEmail,
            });

            if (error) throw error;

            setEmailSent(true);
            toast({
                title: 'Emel Dihantar Semula!',
                description: 'Sila semak peti masuk anda.',
            });

            // Mark onboarding as complete (but email not verified yet)
            await markOnboardingComplete();

        } catch (error: any) {
            console.error('Error sending verification email:', error);
            toast({
                title: 'Ralat',
                description: error.message || 'Gagal menghantar emel. Sila cuba lagi.',
                variant: 'destructive',
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleResendEmail = async () => {
        setIsResending(true);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: userEmail,
            });

            if (error) throw error;

            toast({
                title: 'Emel Dihantar Semula!',
                description: 'Sila semak peti masuk anda.',
            });

        } catch (error: any) {
            console.error('Error resending email:', error);
            toast({
                title: 'Ralat',
                description: error.message || 'Gagal menghantar semula emel.',
                variant: 'destructive',
            });
        } finally {
            setIsResending(false);
        }
    };

    const markOnboardingComplete = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.log('❌ No auth user found');
                return;
            }

            const { error } = await supabase
                .from('admin_users')
                .update({ onboarding_completed: true })
                .eq('auth_user_id', user.id);

            if (error) {
                console.error('❌ Error marking onboarding complete:', error);
            } else {
                console.log('✅ Onboarding marked as complete!');
            }
        } catch (error) {
            console.error('❌ Exception marking onboarding complete:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Email already sent during registration - show instructions */}
            <div className="space-y-6">
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        <img
                            src="/icons8-done.gif"
                            alt="Success"
                            className="h-24 w-24"
                        />
                    </div>
                    <h3 className="font-bold text-xl">Emel Pengesahan Telah Dihantar!</h3>
                    <p className="text-muted-foreground">
                        Semasa pendaftaran akaun, kami telah menghantar emel pengesahan ke:
                    </p>
                    <p className="font-semibold text-green-600 text-lg">{userEmail}</p>
                </div>

                <Alert variant="default" className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900">Tidak jumpa emel?</AlertTitle>
                    <AlertDescription className="text-amber-800">
                        Semak folder spam atau junk. Emel mungkin mengambil masa beberapa minit untuk sampai.
                    </AlertDescription>
                </Alert>

                <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">Langkah Seterusnya:</h4>
                    </div>
                    <ol className="space-y-2 text-sm">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                1
                            </span>
                            <span className="pt-0.5">Buka peti masuk emel anda</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                2
                            </span>
                            <span className="pt-0.5">Cari emel daripada Raya Studio</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                3
                            </span>
                            <span className="pt-0.5">Klik pautan pengesahan dalam emel</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                4
                            </span>
                            <span className="pt-0.5">Anda akan dibawa ke dashboard secara automatik</span>
                        </li>
                    </ol>
                </div>

                <div className="space-y-3">
                    <Button
                        variant="outline"
                        onClick={handleResendEmail}
                        disabled={isResending}
                        className="w-full"
                    >
                        {isResending ? 'Menghantar...' : 'Hantar Semula Emel'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Selepas mengesahkan emel, sila log masuk semula untuk mengakses dashboard anda.
                    </p>
                </div>
            </div>
        </div>
    );
}
