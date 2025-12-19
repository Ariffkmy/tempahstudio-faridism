import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Import step components
import OnboardingStep1 from '@/components/onboarding/OnboardingStep1';
import OnboardingStep2 from '@/components/onboarding/OnboardingStep2';
import OnboardingStep3 from '@/components/onboarding/OnboardingStep3';
import OnboardingStep4 from '@/components/onboarding/OnboardingStep4';

export default function Onboarding() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Get payment data from navigation state
    const paymentData = location.state as {
        fullName?: string;
        email?: string;
        phone?: string;
        studioName?: string;
    } | null;

    const steps = [
        { number: 1, title: 'Daftar akaun', canSkip: false },
        { number: 2, title: 'Maklumat studio', canSkip: true },
        { number: 3, title: 'Pakej', canSkip: true },
        { number: 4, title: 'Waktu operasi', canSkip: true },
    ];

    // Check if user has already completed onboarding and set initial step
    useEffect(() => {
        const checkOnboardingStatus = async () => {
            console.log('🔍 Onboarding: Checking if user already completed onboarding...');

            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (authUser) {
                console.log('👤 Onboarding: User ID:', authUser.id);
                console.log('🔐 Onboarding: User is authenticated (email verified)');

                const { data: userData, error } = await supabase
                    .from('admin_users')
                    .select('onboarding_completed')
                    .eq('auth_user_id', authUser.id)
                    .single();

                console.log('📊 Onboarding: User data:', userData);
                console.log('❌ Onboarding: Error:', error);
                console.log('✅ Onboarding: onboarding_completed =', userData?.onboarding_completed);

                if (userData && userData.onboarding_completed) {
                    // User has already completed onboarding, redirect to dashboard
                    console.log('➡️ Onboarding: Already completed, redirecting to /admin');
                    navigate('/admin');
                } else {
                    // User is authenticated but hasn't completed onboarding
                    // This means Step 1 (registration) is done, start at Step 2
                    console.log('✨ Onboarding: User registered but onboarding not complete');
                    console.log('📍 Onboarding: Starting at Step 2 (Step 1 already completed)');
                    setCurrentStep(2);
                    setCompletedSteps([1]); // Mark Step 1 as completed
                    setIsInitialized(true);
                }
            } else {
                // User not authenticated, start at Step 1
                console.log('🆕 Onboarding: User not authenticated, starting at Step 1');
                setCurrentStep(1);
                setIsInitialized(true);
            }
        };

        checkOnboardingStatus();
    }, [navigate]);

    const markOnboardingComplete = async () => {
        if (!user?.id) return;

        console.log('💾 Onboarding: Marking onboarding as complete...');

        try {
            // Get the auth user ID
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                console.log('❌ Onboarding: No auth user found');
                return;
            }

            console.log('👤 Onboarding: Updating for user ID:', authUser.id);

            const { error } = await supabase
                .from('admin_users')
                .update({ onboarding_completed: true })
                .eq('auth_user_id', authUser.id);

            if (error) {
                console.error('❌ Onboarding: Error marking onboarding complete:', error);
            } else {
                console.log('✅ Onboarding: Successfully marked onboarding as complete!');
            }
        } catch (error) {
            console.error('❌ Onboarding: Exception marking onboarding complete:', error);
        }
    };

    const handleStepComplete = async (stepNumber: number) => {
        if (!completedSteps.includes(stepNumber)) {
            setCompletedSteps([...completedSteps, stepNumber]);
        }

        if (stepNumber < 4) {
            setCurrentStep(stepNumber + 1);
        } else {
            // All steps completed, mark onboarding as complete
            await markOnboardingComplete();

            toast({
                title: 'Tahniah!',
                description: 'Proses onboarding telah selesai. Selamat datang ke Tempah Studio!',
            });
            navigate('/admin');
        }
    };

    const handleSkip = async () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        } else {
            // Skipping last step, mark onboarding as complete
            await markOnboardingComplete();
            navigate('/admin');
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const progress = (completedSteps.length / steps.length) * 100;

    // Show loading state while initializing
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Memuatkan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="max-w-4xl mx-auto mb-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2 text-primary">
                            Selamat Datang ke Tempah Studio
                        </h1>
                        <p className="text-muted-foreground">
                            Mari lengkapkan beberapa langkah untuk memulakan perjalanan anda
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Langkah</span>
                            <span className="text-sm font-medium">{completedSteps.length} / {steps.length}</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Step Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {steps.map((step) => (
                            <div
                                key={step.number}
                                className={`relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${currentStep === step.number
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : completedSteps.includes(step.number)
                                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                    }`}
                            >
                                <div
                                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${completedSteps.includes(step.number)
                                        ? 'bg-green-500 text-white'
                                        : currentStep === step.number
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {completedSteps.includes(step.number) ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        step.number
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{step.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                <div className="max-w-4xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="shadow-xl">
                                <CardHeader>
                                    <CardTitle className="text-2xl">
                                        Langkah {currentStep}: {steps[currentStep - 1].title}
                                    </CardTitle>
                                    <CardDescription>
                                        {currentStep === 1 && 'Daftar akaun admin untuk mengurus studio anda'}
                                        {currentStep === 2 && 'Masukkan maklumat asas tentang studio anda'}
                                        {currentStep === 3 && 'Tetapkan pakej-pakej yang ditawarkan'}
                                        {currentStep === 4 && 'Tetapkan waktu operasi studio anda'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {currentStep === 1 && <OnboardingStep1 onComplete={() => handleStepComplete(1)} initialData={paymentData} />}
                                    {currentStep === 2 && <OnboardingStep2 onComplete={() => handleStepComplete(2)} />}
                                    {currentStep === 3 && <OnboardingStep3 onComplete={() => handleStepComplete(3)} />}
                                    {currentStep === 4 && <OnboardingStep4 onComplete={() => handleStepComplete(4)} />}

                                    {/* Navigation Buttons */}
                                    <div className="flex justify-between mt-8 pt-6 border-t">
                                        <Button
                                            variant="outline"
                                            onClick={handleBack}
                                            disabled={currentStep === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-2" />
                                            Kembali
                                        </Button>

                                        {steps[currentStep - 1].canSkip && (
                                            <Button
                                                variant="ghost"
                                                onClick={handleSkip}
                                            >
                                                Langkau
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
