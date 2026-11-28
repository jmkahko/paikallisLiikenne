import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { TextProvider } from './i18n/texts.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TextProvider>
      <App />
    </TextProvider>
  </React.StrictMode>
)
