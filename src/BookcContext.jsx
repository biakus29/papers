import React, { createContext, useContext, useState } from 'react';

const BookContext = createContext();

export const BookProvider = ({ children }) => {
  const [book, setBook] = useState(null);

  return (
    <BookContext.Provider value={{ book, setBook }}>
      {children}
    </BookContext.Provider>
  );
};

export const useBook = () => useContext(BookContext);
