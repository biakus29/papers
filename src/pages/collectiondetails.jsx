import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { ChevronLeft } from 'react-feather';

const CollectionDetails = () => {
  const [bookDetails, setBookDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Affiche dans la console les données transmises par la navigation
  console.log('Location State:', location.state);
  
  // On récupère nom et livres depuis location.state
  const { nom, livres } = location.state || {};

  useEffect(() => {
    const fetchBooksDetails = async () => {
      // Vérifie que "livres" est un tableau non vide
      if (!Array.isArray(livres) || livres.length === 0) {
        console.log('Aucun livre dans la collection ou "livres" n\'est pas défini.');
        setLoading(false);
        return;
      }

      try {
        const firestore = getFirestore();
        const booksData = await Promise.all(
          livres.map(async (bookName) => {
            console.log('Recherche du livre:', bookName);
            const q = query(
              collection(firestore, 'livres'),
              where('name', '==', bookName)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              return { 
                id: querySnapshot.docs[0].id, 
                ...querySnapshot.docs[0].data() 
              };
            }
            return null;
          })
        );
        console.log('Livres récupérés:', booksData);
        // Filtre les résultats nuls
        setBookDetails(booksData.filter(book => book !== null));
      } catch (error) {
        console.error('Error fetching book details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooksDetails();
  }, [livres]);

  const handleBookPress = (book) => {
    navigate('/book-details', { state: { book } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!nom || !livres) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Collection non trouvée</h2>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center mb-8 pb-4 border-b border-gray-200">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-700 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">{nom}</h1>
      </div>

      {/* Books Grid */}
      {bookDetails.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bookDetails.map((book) => (
            <div 
              key={book.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleBookPress(book)}
            >
              {/* Book Cover */}
              <div className="relative pt-[150%] overflow-hidden">
                <img
                  src={book.coverUrl || 'https://via.placeholder.com/300x450'}
                  alt={book.name}
                  className="absolute top-0 left-0 w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>

              {/* Book Info */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 line-clamp-2 mb-1">{book.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{book.hauteur}</p>
                <p className="text-gray-500 text-sm line-clamp-3">{book.summary}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h4 className="text-xl text-gray-600">Aucun livre disponible dans cette collection</h4>
        </div>
      )}
    </div>
  );
};

export default CollectionDetails;
