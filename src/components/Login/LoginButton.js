import React from 'react';
import { FaLinkedin } from 'react-icons/fa';

const LoginButton = ({ onLoginSuccess }) => {
  const handleLogin = async () => {
    const clientId = '78az37axd2up1i'; // Replace with your LinkedIn Client ID
    const redirectUri = chrome.identity.getRedirectURL();
    const scope = 'r_liteprofile r_emailaddress'; // Adjust scopes as necessary
    const state = generateRandomString(16);

    try {
      // Store the state using a Promise to ensure it's saved before proceeding
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({ oauthState: state }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=token&client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=${encodeURIComponent(scope)}&state=${state}`;

      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        async (redirectedTo) => {
          if (chrome.runtime.lastError) {
            console.error('launchWebAuthFlow Error:', chrome.runtime.lastError);
            alert('Authentication failed. Please try again.');
            return;
          }

          console.log('Redirected URL:', redirectedTo);

          try {
            const url = new URL(redirectedTo);
            const hash = url.hash.substring(1); // Remove the '#'
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const returnedState = params.get('state');

            console.log('Returned State:', returnedState);
            console.log('Generated State:', state);

            // Retrieve the stored state using a Promise
            const result = await new Promise((resolve, reject) => {
              chrome.storage.local.get(['oauthState'], (result) => {
                if (chrome.runtime.lastError) {
                  reject(chrome.runtime.lastError);
                } else {
                  resolve(result);
                }
              });
            });

            const storedState = result.oauthState;
            console.log('Stored State:', storedState);

            // Validate the state parameter
            if (storedState !== returnedState) {
              console.error('State mismatch. Potential CSRF attack.');
              alert('Authentication failed. Please try again.');
              return;
            }

            if (accessToken) {
              // Store the access token securely
              await new Promise((resolve, reject) => {
                chrome.storage.local.set({ linkedinAccessToken: accessToken }, () => {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                  } else {
                    resolve();
                  }
                });
              });

              console.log('LinkedIn access token stored successfully.');

              // Clear the stored state as it's no longer needed
              await new Promise((resolve, reject) => {
                chrome.storage.local.remove(['oauthState'], () => {
                  if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                  } else {
                    resolve();
                  }
                });
              });

              if (onLoginSuccess) {
                onLoginSuccess();
              }
            } else {
              console.error('Access token not found in the URL.');
              alert('Authentication failed. Access token not found.');
            }
          } catch (error) {
            console.error('Error processing OAuth response:', error);
            alert('Authentication failed. Please try again.');
          }
        }
      );
    } catch (error) {
      console.error('Error storing state:', error);
      alert('Authentication failed. Please try again.');
    }
  };

  // Generate a random string of given length using crypto for security
  const generateRandomString = (length) => {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const cryptoObj = window.crypto || window.msCrypto; // For IE 11
    const randomValues = new Uint32Array(length);
    cryptoObj.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charset.length];
    }
    return result;
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition duration-200"
      aria-label="Connect with LinkedIn"
    >
      <FaLinkedin className="mr-2" /> Connect with LinkedIn
    </button>
  );
};

export default LoginButton;
