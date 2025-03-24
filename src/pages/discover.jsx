import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { auth } from '../firebase';
import { Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import logo from './assets/images/logo.png';
import './assets/css/DiscoverScreen.css';
import SearchBar from './SearchBar';
import { Home, Compass, Bookmark } from 'react-feather';

export default function DiscoverScreen() {
  const [categoriesBook, setCategoriesBook] = useState([]);
  const [books, setBooks] = useState([]);
  const [bestBooks, setBestBooks] = useState([]);
  const [mostRead, setMostRead] = useState([]);
  const [freeBooks, setFreeBooks] = useState([]);
  const [collections, setCollections] = useState([]); // État pour les collections
  const [loading, setLoading] = useState(true);
  const [loadingCovers, setLoadingCovers] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const isUserLoggedIn = Boolean(auth.currentUser);

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  // Récupération des collections en utilisant les champs "cover_img" et "nom"
  const fetchCollections = async () => {
    try {
      const firestore = getFirestore();
      const collectionsRef = collection(firestore, 'collections');
      const collectionsSnapshot = await getDocs(collectionsRef);
      const collectionsList = collectionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCollections(collectionsList);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const firestore = getFirestore();

        // Récupération des livres récents
        const booksCollection = query(
          collection(firestore, 'livres'),
          orderBy('dateAdded', 'desc'),
          limit(20)
        );
        const booksSnapshot = await getDocs(booksCollection);
        const booksList = booksSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(book => book.verdict === 'accepted');
        setBooks(booksList);

        // Récupération des livres gratuits
        const freeBooksCollection = query(
          collection(firestore, 'livres'),
          where('price', '==', 0)
        );
        const freeBooksSnapshot = await getDocs(freeBooksCollection);
        const freeBooksList = freeBooksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFreeBooks(freeBooksList);

        // Récupération des catégories
        const categoriesCollection = collection(firestore, 'catégories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategoriesBook(categoriesList);

        // Récupération des livres les plus vus
        const topViewedBooksCollection = query(
          collection(firestore, 'livres'),
          orderBy('nbr_vues', 'desc'),
          limit(3)
        );
        const topViewedBooksSnapshot = await getDocs(topViewedBooksCollection);
        const topViewedBooksList = topViewedBooksSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(book => book.verdict === 'accepted');
        setBestBooks(topViewedBooksList);

        // Récupération des livres les mieux notés
        const allBooksSnapshot = await getDocs(collection(firestore, 'livres'));
        const allBooksList = allBooksSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            note: parseFloat(doc.data().note),
          }))
          .filter(book => book.verdict === 'accepted');
        const sortedBooks = allBooksList.sort((a, b) => b.note - a.note);
        setMostRead(sortedBooks.slice(0, 3));

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
        setLoadingCovers(false);
      }
    };

    fetchCollections(); // Récupérer les collections
    fetchData();
  }, []);

  const handlePress = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const truncateTitle = (title, maxLength = 30) => {
    if (title.length > maxLength) {
      return title.substring(0, maxLength) + '...';
    }
    return title;
  };

  const handleButtonClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const renderBook = (item) => (
    <Col xs={12} md={6} lg={4} key={item.id} className="mb-4">
      <Card 
        onClick={() => handlePress(item.id)} 
        className="d-flex flex-column align-items-center p-0 m-10 border-0 bg-transparent"
      >
        {loadingCovers ? (
          <div className="skeletonBookCover" />
        ) : (
          <Card.Img 
            onClick={() => handlePress(item.id)}
            variant="top" 
            src={item.coverUrl} 
            alt={item.name} 
            className="bookCover img-fluid" 
            style={{ width: '150px', height: '225px', objectFit: 'cover' }} 
          />
        )}
        <Card.Body className="text-center">
          <Card.Title className="book-title text-dark mt-2">
            {truncateTitle(item.name)}
          </Card.Title>
        </Card.Body>
      </Card>
    </Col>
  );

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={logo} className="logo" alt="logo" />
          <Spinner animation="border" variant="primary" style={{ marginTop: 11 }} />
        </div>
      </Container>
    );
  }

  return (
    <Container style={{ padding: 0 }}>
      <nav style={{
        height: 80, 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'white',
        zIndex: 1000,
        padding: 8
      }}>
        <p style={{ fontSize: 24, fontWeight: 'bold', marginTop: 15 }}>Découverte</p>
        <p style={{ border: "1px solid black", width: 70, borderColor: "#0cc0df", marginTop: -15, borderWidth: 2, borderRadius: 50 }}></p>
      </nav>

      <div style={{ justifyContent: 'center' }}>
        <div className="mb-4 my-4" style={{ display: "flex", justifyContent: 'center', alignItems: 'center', margin: 20, width: "100%" }}>
          <SearchBar books={books} onBookPress={handlePress} />
        </div>

        {/* Section Nouveautés */}
        <div className="section mb-4">
          <h2 className="d-flex justify-content-start" style={{ marginLeft: 8, textDecoration: 'none', borderBottom: 'none' }}>Nouveautés</h2>
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 25 }}>
              {books.map((book) => (
                <div key={book.id} style={{ margin: '0 -15px', display: 'inline-block' }}>
                  <div style={{ width: 200 }}>
                    <img
                      onClick={() => handlePress(book.id)}
                      src={book.coverUrl}
                      alt={book.name}
                      className="img-fluid"
                      style={{ width: '150px', height: '225px', objectFit: 'cover' }}
                    />
                    <p style={{ maxWidth: '100px', fontSize: '12px' }} className="mt-2 text-dark">
                      {truncateTitle(book.name)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Livres Gratuits */}
        <div className="section mb-4">
          <h2 className="d-flex justify-content-start" style={{ marginLeft: 8, textDecoration: 'none', borderBottom: 'none' }}>Livres Gratuits</h2>
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 25 }}>
              {freeBooks
                .filter(book => book.verdict === 'accepted' && book.price === 0)
                .map((book) => (
                  <div key={book.id} style={{ margin: '0 -15px', display: 'inline-block' }}>
                    <div style={{ width: 200 }}>
                      <img
                        onClick={() => handlePress(book.id)}
                        src={book.coverUrl}
                        alt={book.name}
                        className="img-fluid"
                        style={{ width: '150px', height: '225px', objectFit: 'cover' }}
                      />
                      <p style={{ maxWidth: '100px', fontSize: '12px' }} className="mt-2 text-dark">
                        {truncateTitle(book.name)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Section Collections placée après les livres gratuits */}
        <div className="section mb-4">
          <h2 className="d-flex justify-content-start" style={{ marginLeft: 8 }}>Nos Collections</h2>
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 25 }}>
              {collections.map(collection => (
                <div 
                  key={collection.id} 
                  style={{ margin: '0 15px', cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => navigate(`/collection/${collection.id}`)}
                >
                  <img
                    src={collection.cover_img || '/default-collection.jpg'}
                    alt={collection.nom}
                    style={{ width: '150px', height: '225px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <p style={{ marginTop: '8px', fontWeight: 'bold' }}>{collection.nom}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Les Plus Populaires */}
        <div className="section mb-4">
          <h2 className="d-flex justify-content-start" style={{ marginLeft: 8, textDecoration: 'none', borderBottom: 'none' }}>
            Les Plus Populaires
          </h2>
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 25 }}>
              {bestBooks.map((book) => (
                <div key={book.id} style={{ margin: '0 -15px', display: 'inline-block' }}>
                  <div style={{ width: 200 }}>
                    <img
                      onClick={() => handlePress(book.id)}
                      src={book.coverUrl}
                      alt={book.name}
                      className="img-fluid"
                      style={{ width: '150px', height: '225px', objectFit: 'cover' }}
                    />
                    <p style={{ maxWidth: '100px', fontSize: '12px' }} className="mt-2 text-dark">
                      {truncateTitle(book.name)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Les Mieux Notés */}
        <div className="section mb-4">
          <h2 className="d-flex justify-content-start" style={{ marginLeft: 8, textDecoration: 'none', borderBottom: 'none' }}>
            Les Mieux Notés
          </h2>
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 25 }}>
              {mostRead.map((book) => (
                <div key={book.id} style={{ margin: '0 -15px', display: 'inline-block' }}>
                  <div style={{ width: 200 }}>
                    <img
                      onClick={() => handlePress(book.id)}
                      src={book.coverUrl}
                      alt={book.name}
                      className="img-fluid"
                      style={{ width: '150px', height: '225px', objectFit: 'cover' }}
                    />
                    <p style={{ maxWidth: '100px', fontSize: '12px' }} className="mt-2 text-dark">
                      {truncateTitle(book.name)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section Nos Catégories */}
        <div className="section mb-4">
          <h2 className="d-flex justify-content-start" style={{ marginLeft: 8 }}>Nos Catégories</h2>
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0', height: 150 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', paddingLeft: 25 }}>
              {categoriesBook.map(item => (
                <div key={item.id} style={{ 
                  margin: '0 15px', 
                  padding: '15px', 
                  borderRadius: '8px', 
                  backgroundColor: '#f5f5f5', 
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
                  cursor: 'pointer', 
                  textAlign: 'center' 
                }} 
                onClick={() => navigate('/CategoryDetail', { state: { category: item.nom } })}>
                  <p className="categoryText" style={{ margin: 0 }}>{item.nom}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
  
      </div>
      
      {/* Barre de navigation en bas */}
      <div style={{
        padding: "10px 0",
        display: 'flex',
        justifyContent: 'space-between',
        borderTopColor: '#E0E0E0',
        backgroundColor: '#f0f0f0',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
         <button onClick={() => navigate('/homes')} style={{ alignItems: 'center', flex: 1, border: 'none' }}>
           <Home size={24} color='#0cc0df' />
           <p style={{ color: '#0cc0df', fontSize: 11 }}>Accueil</p>
         </button>
         <button onClick={() => navigate('/discover')} style={{ alignItems: 'center', flex: 1, border: 'none' }}>
           <Compass size={24} />
           <p style={{ color: '#000', fontSize: 11 }}>Découvrez</p>
         </button>
         <button 
           onClick={() => {
             if (isUserLoggedIn) {
               navigate('/profile');
             } else {
               navigate('/login');
             }
           }} 
           style={{ alignItems: 'center', flex: 1, border: 'none', background: 'none', cursor: 'pointer' }}
         >
           <Bookmark size={24} />
           <p style={{ color: '#000', fontSize: 11 }}>profile</p>
         </button>
      </div>
      
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2>Connexion requise</h2>
            <p>Veuillez vous connecter à la version mobile de Papers pour plus de fonctionnalités.</p>
            <button onClick={closeModal} style={styles.closeButton}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </Container>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    maxWidth: '400px',
    textAlign: 'center',
  },
  closeButton: {
    marginTop: '15px',
    padding: '10px 20px',
    backgroundColor: '#0cc0df',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
  },
};
