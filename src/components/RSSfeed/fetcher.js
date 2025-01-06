// src/components/RSSfeed/fetcher.js

// Listen for messages from the parent window
window.addEventListener('message', async (event) => {
  console.log('Fetcher received message:', event.data);

  // Ensure the message is coming from your extension
  if (event.origin !== window.location.origin) {
    console.warn('Fetcher received message from unknown origin:', event.origin);
    return;
  }

  const { action, feedUrl } = event.data;

  if (action === 'fetchRSSFeed' && feedUrl) {
    try {
      console.log(`Fetching RSS feed from: ${feedUrl}`);
      // Attempt to fetch the RSS feed
      const response = await fetch(feedUrl);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const xmlText = await response.text();

      // Parse the RSS feed
      const parser = new DOMParser();
      const xml = parser.parseFromString(xmlText, "application/xml");

      const parseError = xml.querySelector("parsererror");
      if (parseError) {
        throw new Error("Error parsing RSS feed XML.");
      }

      // Extract feed details
      const channel = xml.querySelector("channel");
      if (!channel) {
        throw new Error("Invalid RSS feed structure.");
      }

      const title = channel.querySelector("title")?.textContent || "No Title";
      const image = channel.querySelector("image > url")?.textContent || "";

      const items = channel.querySelectorAll("item");
      const feedItems = Array.from(items).map(item => ({
        title: item.querySelector("title")?.textContent || "No Title",
        link: item.querySelector("link")?.textContent || "",
        description: item.querySelector("description")?.textContent || "",
        pubDate: item.querySelector("pubDate")?.textContent || "",
        thumbnail: item.querySelector("enclosure")?.getAttribute("url") || ""
      }));

      const feed = {
        title,
        image,
        items: feedItems
      };

      console.log('RSS feed fetched and parsed successfully:', feed);

      // Send the feed data back to the parent window
      window.parent.postMessage({ action: 'rssFeedData', feed }, window.location.origin);
    } catch (error) {
      console.error('Error fetching RSS feed:', error);
      // Send the error back to the parent window
      window.parent.postMessage({ action: 'rssFeedError', error: error.message }, window.location.origin);
    }
  }
});
