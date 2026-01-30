import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import LiveLogFeed from './LiveLogFeed'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <LiveLogFeed />
  </React.StrictMode>,
)
