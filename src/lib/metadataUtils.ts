
/**
 * Utility functions for managing document metadata for SEO and social sharing
 */

/**
 * Updates the document title
 * @param title The new title to set
 */
export const setDocumentTitle = (title: string): void => {
  document.title = title;
};

/**
 * Updates Open Graph and other metadata tags in the document head
 */
export const updateMetaTags = ({
  title,
  description,
  imageUrl,
  url,
}: {
  title?: string;
  description?: string;
  imageUrl?: string;
  url?: string;
}): void => {
  // Update Open Graph title
  if (title) {
    updateOrCreateMetaTag('og:title', title);
    updateOrCreateMetaTag('twitter:title', title);
  }

  // Update description
  if (description) {
    updateOrCreateMetaTag('description', description);
    updateOrCreateMetaTag('og:description', description);
    updateOrCreateMetaTag('twitter:description', description);
  }

  // Update image
  if (imageUrl) {
    updateOrCreateMetaTag('og:image', imageUrl);
    updateOrCreateMetaTag('twitter:image', imageUrl);
  }

  // Update URL
  if (url) {
    updateOrCreateMetaTag('og:url', url);
  }
};

/**
 * Updates an existing meta tag or creates a new one if it doesn't exist
 */
const updateOrCreateMetaTag = (name: string, content: string): void => {
  // For Open Graph and Twitter tags, use property attribute
  const isOgTag = name.startsWith('og:');
  const isTwitterTag = name.startsWith('twitter:');
  
  let selector = isOgTag ? `meta[property="${name}"]` : 
                isTwitterTag ? `meta[name="${name}"]` : 
                `meta[name="${name}"]`;
  
  let element = document.querySelector(selector) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    
    // Set the appropriate attribute based on tag type
    if (isOgTag || isTwitterTag) {
      if (isOgTag) {
        element.setAttribute('property', name);
      } else {
        element.setAttribute('name', name);
      }
    } else {
      element.setAttribute('name', name);
    }
    
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
};

/**
 * Reset metadata tags to their default values when navigating away from a page
 */
export const resetMetaTags = (): void => {
  // Reset title to default
  document.title = "Demo Manager by Basic Wavez";
  
  // Reset Open Graph and meta tags
  updateMetaTags({
    title: "Demo Manager by Basic Wavez",
    description: "Share music demos, collect feedback, and track performance - all in one place",
    imageUrl: "/lovable-uploads/723beaa8-0198-4cde-8ef2-d170e19e5512.png",
    url: window.location.origin
  });
};
