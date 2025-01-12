// src/components/Login/ConnectionsList.jsx

import React, { useState, useEffect } from 'react';
import { FaSpinner } from 'react-icons/fa';

const ConnectionsList = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConnections = async () => {
      chrome.storage.local.get(['linkedinAccessToken'], async (result) => {
        const accessToken = result.linkedinAccessToken;
        if (!accessToken) {
          setError('No access token found. Please log in.');
          setLoading(false);
          return;
        }

        try {
          // Replace with the correct LinkedIn API endpoint for connections
          // Note: As of September 2021, LinkedIn's API does not provide a direct endpoint to fetch all connections
          // Ensure you have the necessary permissions or use available endpoints
          const url = 'https://api.linkedin.com/v2/connections?q=viewer&start=0&count=50'; // Example endpoint

          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Cache-Control': 'no-cache',
              'X-Restli-Protocol-Version': '2.0.0',
            },
          });

          if (!response.ok) {
            if (response.status === 401) {
              setError('Access token expired. Please log in again.');
              chrome.storage.local.remove(['linkedinAccessToken']);
            } else {
              setError(`Error fetching connections: ${response.statusText}`);
            }
            setLoading(false);
            return;
          }

          const data = await response.json();

          // Adjust based on the actual API response structure
          setConnections(data.elements || []);
          setLoading(false);
        } catch (err) {
          console.error('Error fetching connections:', err);
          setError('Failed to fetch connections. Please try again.');
          setLoading(false);
        }
      });
    };

    fetchConnections();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <FaSpinner className="animate-spin mr-2" /> Loading connections...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (connections.length === 0) {
    return <div>No connections found.</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Your LinkedIn Connections</h2>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {connections.map((conn) => (
          <li key={conn.id} className="p-2 bg-gray-100 rounded">
            <span className="font-medium">
              {conn.firstName.localized.en_US} {conn.lastName.localized.en_US}
            </span>
            {/* Optionally, add more details like position, company, etc. */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConnectionsList;
