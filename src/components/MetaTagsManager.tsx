import { useEffect } from 'react';
import { useStudio } from '@/contexts/StudioContext';

/**
 * MetaTagsManager - Dynamically updates meta tags based on studio context
 * This component should be placed at the root level of your app
 */
const MetaTagsManager = () => {
    const { selectedStudio } = useStudio();

    useEffect(() => {
        // Default values
        const defaultStudioName = 'Raya Studio';
        const studioName = selectedStudio?.name || defaultStudioName;

        // Update page title
        document.title = `Tempah Studio | Tempah studio raya anda bersama ${studioName}`;

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', `Tempah studio raya anda bersama ${studioName}`);
        }

        // Update Open Graph title
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute('content', `Tempah studio raya anda bersama ${studioName}`);
        }

        // Update Open Graph description
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            ogDescription.setAttribute('content', `Tempah studio raya anda bersama ${studioName}. Seamless online booking, premium equipment, and dedicated support.`);
        }

        // Update Twitter card title (if you add it later)
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) {
            twitterTitle.setAttribute('content', `Tempah studio raya anda bersama ${studioName}`);
        }

        // If studio has a custom logo, update the favicon
        if (selectedStudio?.studio_logo) {
            const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (favicon) {
                favicon.href = selectedStudio.studio_logo;
            }
        }

    }, [selectedStudio]);

    // This component doesn't render anything
    return null;
};

export default MetaTagsManager;
