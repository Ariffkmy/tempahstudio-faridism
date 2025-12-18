// Package tier configuration for feature access control

export const PACKAGE_TIERS = {
    SILVER: 'silver',
    GOLD: 'gold',
    PLATINUM: 'platinum',
} as const;

export type PackageTier = typeof PACKAGE_TIERS[keyof typeof PACKAGE_TIERS];

// Feature identifiers
export const FEATURES = {
    WHATSAPP_BLAST: 'whatsapp_blast',
    BOOKING_CUSTOMIZATION: 'booking_customization',
    FPX_PAYMENT: 'fpx_payment',
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

// Feature access matrix - defines which features are available for each tier
export const packageFeatures: Record<PackageTier, Feature[]> = {
    silver: [],
    gold: [FEATURES.WHATSAPP_BLAST, FEATURES.BOOKING_CUSTOMIZATION],
    platinum: [FEATURES.WHATSAPP_BLAST, FEATURES.BOOKING_CUSTOMIZATION, FEATURES.FPX_PAYMENT],
};

// Sub-account limits per tier
export const SUB_ACCOUNT_LIMITS: Record<PackageTier, number> = {
    silver: 1,
    gold: 2,
    platinum: Infinity,
};

// Helper to get tier display name
export function getTierDisplayName(tier: PackageTier | string): string {
    const tierMap: Record<string, string> = {
        silver: 'Silver',
        gold: 'Gold',
        platinum: 'Platinum',
    };
    return tierMap[tier.toLowerCase()] || tier;
}

// Helper to get feature display name
export function getFeatureDisplayName(feature: Feature): string {
    const featureMap: Record<Feature, string> = {
        whatsapp_blast: 'WhatsApp Blast',
        booking_customization: 'Booking Form Customization',
        fpx_payment: 'FPX Payment Option',
    };
    return featureMap[feature];
}
