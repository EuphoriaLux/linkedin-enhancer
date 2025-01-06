// src/components/RSSfeed/fetcher.js

// Listen for messages from the parent window
window.addEventListener('message', async (event) => {
  if (event.origin !== window.location.origin) return;

  const { action, feedUrl } = event.data;

  if (action === 'fetchRSSFeed') {
    try {
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const text = await response.text();
      
      // Parse the RSS feed
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, "application/xml");

      // Check for parsererror
      if (xml.querySelector("parsererror")) {
        throw new Error("Error parsing RSS feed.");
      }

      // Extract feed information
      const feedTitle = xml.querySelector("channel > title")?.textContent || "No Title";
      let feedImage = xml.querySelector("channel > image > url")?.textContent || null;

      // If feedImage is a relative URL, convert it to absolute
      if (feedImage && !/^https?:\/\//i.test(feedImage)) {
        const baseUrl = new URL(feedUrl).origin;
        feedImage = new URL(feedImage, baseUrl).href;
      }

      // Extract items
      const items = Array.from(xml.querySelectorAll("item")).map(item => {
        // Attempt to extract image from different possible fields
        let image = item.querySelector("media\\:content, content\\:media, enclosure[url][type^='image/']")?.getAttribute('url') ||
                    item.querySelector("description img")?.getAttribute('src') ||
                    null;
        
        // If image is embedded in description as HTML
        if (!image) {
          const description = item.querySelector("description")?.textContent || "";
          const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
          image = imgMatch ? imgMatch[1] : null;
        }

        // Convert relative image URLs to absolute
        if (image && !/^https?:\/\//i.test(image)) {
          const baseUrl = new URL(feedUrl).origin;
          image = new URL(image, baseUrl).href;
        }

        return {
          title: item.querySelector("title")?.textContent || "No Title",
          link: item.querySelector("link")?.textContent || "",
          description: item.querySelector("description")?.textContent || "",
          pubDate: item.querySelector("pubDate")?.textContent || "",
          image: image, // May be null
        };
      });

      // Construct the feed object
      const feed = {
        title: feedTitle,
        url: feedUrl,
        image: feedImage, // May be null
        items: items,
      };

      console.log('📥 Feed Data:', feed); // Debugging

      // Post the feed data back to the parent
      event.source.postMessage({ action: 'rssFeedData', feed }, event.origin);
    } catch (error) {
      console.error('❌ Error fetching RSS feed:', error);
      event.source.postMessage({ action: 'rssFeedError', error: error.message }, event.origin);
    }
  }
});
