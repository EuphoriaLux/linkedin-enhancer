// src/utils/linkedinApi.js

export const fetchLinkedInConnections = async () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['linkedinAccessToken'], async (result) => {
        const accessToken = result.linkedinAccessToken;
        if (!accessToken) {
          reject('No access token found. Please log in.');
          return;
        }
  
        const url = 'https://api.linkedin.com/v2/connections'; // Replace with actual endpoint
  
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0'
            }
          });
  
          if (response.status === 401) {
            // Token expired or invalid
            reject('Access token expired. Please log in again.');
            // Optionally, clear the token
            chrome.storage.local.remove(['linkedinAccessToken']);
            return;
          }
  
          if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
          }
  
          const data = await response.json();
          resolve(data);
        } catch (error) {
          console.error('Error fetching connections:', error);
          reject(error);
        }
      });
    });
  };
  