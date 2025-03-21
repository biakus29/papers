import React, { createContext, useState, useContext } from "react";

// Créer un contexte
const AppContext = createContext();

// Créer un fournisseur de contexte
export const AppProvider = ({ children }) => {
  const [sharedState, setSharedState] = useState({}); // Initialisation avec un objet vide

  return (
    <AppContext.Provider
      value={{
        sharedState,
        setSharedState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
