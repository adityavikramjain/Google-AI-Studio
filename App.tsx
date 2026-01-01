import React, { useState } from 'react';
import { ApiKeyGateway } from './components/ApiKeyGateway';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);

  // In a real production app, we might check local storage or env vars here.
  // For this demo, we strictly require user input via the Gateway.

  if (!apiKey) {
    return <ApiKeyGateway onInitialize={setApiKey} />;
  }

  return <Dashboard apiKey={apiKey} />;
}