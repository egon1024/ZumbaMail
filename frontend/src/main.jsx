
// import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './pulse.min.css';


import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import 'react-phone-input-2/lib/style.css';
import App from './App.jsx';
import { APP_TITLE } from './appConfig';

document.title = APP_TITLE;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
