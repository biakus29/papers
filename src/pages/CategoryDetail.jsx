import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import './assets/css/CategoryDetails.css'; // Importez les styles spécifiques

const CategoryDetails = () => {
  const location = useLocation();
  const { state } = location;
  const category = state?.category; // Déstructuration sécurisée
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBooksByCategory = async () => {
      try {
        const firestore = getFirestore();
        const booksQuery = query(
          collection(firestore, 'livres'),
          where('genre', '==', category)
        );
        const booksSnapshot = await getDocs(booksQuery);
        const booksList = booksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBooks(booksList);
      } catch (error) {
        console.error('Error fetching books by category:', error);
      }
    };

    if (category) {
      fetchBooksByCategory();
    } else {
      console.error('Category is not defined');
    }
  }, [category]);

  const handlePress = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="category-details-container">
      <div className="header" style={{display:"flex",alignItems:'center'}}>
        <button className="back-button" onClick={() => navigate(-1)}>
          &lt;
        </button>
        <h1 className="header-title">{category || 'Catégorie inconnue'}</h1>
      </div>
      {books.length === 0 ? (
        <p>Aucun livre trouvé dans cette catégorie.</p>
      ) : (
        <ul className="books-list">
          {books.map(book => (
            <li key={book.id} className="book-item" onClick={() => handlePress(book.id)}>
              <img src={book.coverUrl} alt={book.name} className="book-cover" />
              <div className="book-info">
                <h2 className="book-title">{book.name}</h2>
                <p className="book-height">{book.genre}</p>
                <p className="book-summary" style={{display: '-webkit-box',WebkitBoxOrient: 'vertical',overflow: 'hidden',WebkitLineClamp: 4,maxHeight: '6em',lineHeight: '1.5'}}>{book.summary}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CategoryDetails;