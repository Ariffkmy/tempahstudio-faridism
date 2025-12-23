import { useAuth } from '@/contexts/AuthContext';
import {
    packageFeatures,
    SUB_ACCOUNT_LIMITS,
    PACKAGE_TIERS,
    type Feature,
    type PackageTier
} from '@/config/packageFeatures';

/**
 * Hook to check package tier access and feature availability
 */
export function usePackageAccess() {
    const { studio } = useAuth();

    // Determine current tier (default to Silver if not set)
    const currentTier = (studio?.package_name?.toLowerCase() as PackageTier) || PACKAGE_TIERS.SILVER;

    /**
     * Check if current tier has access to a specific feature
     */
    const hasFeature = (feature: Feature): boolean => {
        const features = packageFeatures[currentTier] || [];
        return features.includes(feature);
    };

    /**
     * Get the maximum number of sub-accounts allowed for current tier
     */
    const getSubAccountLimit = (): number => {
        return SUB_ACCOUNT_LIMITS[currentTier] || 1;
    };

    /**
     * Get the minimum tier required for a specific feature
     */
    const getRequiredTier = (feature: Feature): PackageTier | null => {
        for (const [tier, features] of Object.entries(packageFeatures)) {
            if (features.includes(feature)) {
                return tier as PackageTier;
            }
        }
        return null;
    };

    /**
     * Check if a tier is higher than current tier
     */
    const isHigherTier = (tier: PackageTier): boolean => {
        const tierOrder = [PACKAGE_TIERS.SILVER, PACKAGE_TIERS.GOLD, PACKAGE_TIERS.PLATINUM];
        const currentIndex = tierOrder.indexOf(currentTier);
        const targetIndex = tierOrder.indexOf(tier);
        return targetIndex > currentIndex;
    };

    return {
        hasFeature,
        getSubAccountLimit,
        getRequiredTier,
        isHigherTier,
        currentTier,
    };
}
