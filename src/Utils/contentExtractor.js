// src/utils/contentExtractor.js

/**
 * Extract meaningful content from fetched HTML using regex-based cleaning.
 * @param {string} htmlString - The raw HTML content from the article.
 * @returns {string} - Extracted meaningful text content.
 */
export function extractArticleContent(htmlString) {
    try {
        // Remove <script> and <style> tags and their content
        let cleanContent = htmlString
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

        // Remove all HTML tags
        cleanContent = cleanContent.replace(/<[^>]+>/g, ' ');

        // Replace multiple spaces with a single space
        cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

        // Optionally, implement more sophisticated text extraction here

        return cleanContent.substring(0, 5000); // Limit to 5000 characters
    } catch (error) {
        console.error('❌ Error extracting article content:', error);
        return 'Content extraction failed.';
    }
}
