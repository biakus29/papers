import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { AppProvider } from './AppContext'; // Assurez-vous que le chemin est correct

ReactDOM.render(
  <AppProvider>
    <App />
  </AppProvider>,
  document.getElementById('root')
);
