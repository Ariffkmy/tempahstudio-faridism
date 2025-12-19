import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Sparkles, Zap } from 'lucide-react';
import { getTierDisplayName, getFeatureDisplayName, type PackageTier, type Feature } from '@/config/packageFeatures';

interface UpgradePromptProps {
    requiredTier: PackageTier;
    feature: Feature;
    open: boolean;
    onClose: () => void;
}

export function UpgradePrompt({ requiredTier, feature, open, onClose }: UpgradePromptProps) {
    const tierDisplayName = getTierDisplayName(requiredTier);
    const featureDisplayName = getFeatureDisplayName(feature);

    const getTierColor = (tier: PackageTier) => {
        if (tier === 'gold') return 'from-yellow-400 to-yellow-600';
        if (tier === 'platinum') return 'from-purple-400 to-purple-600';
        return 'from-gray-400 to-gray-600';
    };

    const getTierIcon = (tier: PackageTier) => {
        if (tier === 'platinum') return Sparkles;
        if (tier === 'gold') return Crown;
        return Zap;
    };

    const Icon = getTierIcon(requiredTier);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className={`p-4 rounded-full bg-gradient-to-br ${getTierColor(requiredTier)}`}>
                            <Icon className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <DialogTitle className="text-center text-2xl">
                        Upgrade to {tierDisplayName}
                    </DialogTitle>
                    <DialogDescription className="text-center pt-2">
                        <span className="font-semibold">{featureDisplayName}</span> is available on the{' '}
                        <Badge
                            variant="outline"
                            className={`bg-gradient-to-r ${getTierColor(requiredTier)} text-white border-none`}
                        >
                            {tierDisplayName}
                        </Badge>{' '}
                        plan and above.
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-muted/50 rounded-lg p-4 my-4">
                    <p className="text-sm text-muted-foreground text-center">
                        Unlock this feature and more by upgrading your package.
                    </p>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-row">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Maybe Later
                    </Button>
                    <Button
                        className={`w-full sm:w-auto bg-gradient-to-r ${getTierColor(requiredTier)} text-white hover:opacity-90`}
                        onClick={() => {
                            // TODO: Navigate to package upgrade page or contact sales
                            window.open('mailto:support@rayastudio.com?subject=Package Upgrade Request', '_blank');
                        }}
                    >
                        Contact Sales
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
