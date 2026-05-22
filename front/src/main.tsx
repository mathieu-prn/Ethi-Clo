
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { BrowserRouter } from "react-router-dom";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js");
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
