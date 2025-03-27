import React, { useState, useMemo } from 'react';
import { Search } from 'react-feather';

const SearchBar = ({ books = [], onBookPress }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Normalise le texte pour une recherche insensible à la casse et aux accents
  const normalizeText = (text) => {
    return text
      ?.toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() || "";
  };

  // Recherche dans tous les champs de l'objet livre
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const normalizedQuery = normalizeText(searchQuery);
    
    return books.filter(book => {
      return Object.entries(book).some(([key, value]) => {
        // Ignore les champs spéciaux comme les URLs d'images
        if (key === 'id' || key === 'coverUrl' || key === 'pdfUrl') return false;
        
        // Convertit les nombres et booléens en string pour la recherche
        const stringValue = typeof value === 'object' 
          ? JSON.stringify(value) 
          : String(value);
          
        return normalizeText(stringValue).includes(normalizedQuery);
      });
    });
  }, [searchQuery, books]);

  // Styles
  const styles = {
    container: {
      backgroundColor: '#f5f5f5',
      width: '90%',
      borderRadius: 10,
      padding: 12,
      position: 'relative',
      zIndex: 1000
    },
    inputContainer: {
      display: 'flex',
      alignItems: 'center'
    },
    input: {
      width: "100%",
      marginLeft: 10,
      color: 'black',
      backgroundColor: "transparent",
      border: "none",
      outline: "none",
      fontSize: 16,
    },
    resultsContainer: {
      position: 'absolute',
      width: '100%',
      left: 0,
      marginTop: 8,
      backgroundColor: 'white',
      borderRadius: 8,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxHeight: '300px',
      overflowY: 'auto'
    },
    resultItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#f0f0f0'
      }
    },
    image: {
      height: 40,
      width: 40,
      borderRadius: 4,
      marginRight: 10,
      objectFit: 'cover'
    },
    text: {
      fontSize: 14,
      color: '#333',
      margin: 0
    },
    noResults: {
      padding: '10px',
      color: '#666',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputContainer}>
        <Search color='gray' size={18} />
        <input
          type="text"
          style={styles.input}
          placeholder="Rechercher un livre, auteur, genre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Rechercher un livre"
        />
      </div>

      {searchQuery.length > 0 && (
        <div style={styles.resultsContainer}>
          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <div
                key={book.id}
                style={styles.resultItem}
                onClick={() => {
                  onBookPress(book);
                  setSearchQuery('');
                }}
              >
                <img
                  style={styles.image}
                  src={book.coverUrl || 'https://via.placeholder.com/40'}
                  alt={book.name || 'Livre sans titre'}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40';
                  }}
                />
                <div>
                  <p style={styles.text}>
                    <strong>{book.name || 'Sans titre'}</strong>
                  </p>
                  {book.author && (
                    <p style={{ ...styles.text, fontSize: 12, color: '#666' }}>
                      {book.author}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={styles.noResults}>
              Aucun résultat trouvé pour "{searchQuery}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;