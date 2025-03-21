import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';  
import { useAppContext } from '../AppContext';  
import { Button, Modal, Image, ProgressBar } from 'react-bootstrap';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';  
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './assets/images/logo.jpg';
import { Home, Compass, Bookmark } from 'react-feather'; // Import des icônes

export default function Bibliothèque() {
  const { sharedState } = useAppContext();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [userFavorites, setUserFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  // Récupérer les informations utilisateur
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserFavorites(userDoc.data().favorites || []);
        } else {
          console.error("L'utilisateur n'existe pas dans Firestore.");
        }
      }
      setLoading(false); // Mettre à jour le chargement après avoir vérifié l'utilisateur
    });

    return () => unsubscribe();
  }, []);

  // Récupérer les livres
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksCollection = collection(db, 'livres');
        const booksSnapshot = await getDocs(booksCollection);
        const booksData = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBooks(booksData);
      } catch (error) {
        console.error('Erreur lors de la récupération des livres:', error);
      }
    };
    fetchBooks();
  }, []);

  // Retirer un livre des favoris
  const handleRemoveFavorite = async (bookName) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        favorites: arrayRemove(bookName)
      });
      setUserFavorites(prevFavorites => prevFavorites.filter(fav => fav !== bookName));
    }
  };

  // Vérifier l'état de chargement
  if (loading) {
    return <ProgressBar animated now={100} />;
  }

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <Image src={logo} className="mb-3" width={100} />
        <p>Veuillez vous connecter pour accéder à votre bibliothèque.</p>
      </div>
    );
  }

  // Filtrer les livres en fonction des favoris de l'utilisateur
  const filteredBooks = books.filter(book => userFavorites.includes(book.name));

  // Vérifier si des livres sont filtrés
  console.log('Livres favoris:', filteredBooks);
  console.log('Tous les livres:', books);

  return (
    <div className="container mt-5">
      <header className="d-flex justify-content-between align-items-center py-3 border-bottom">
        <h1 className="h2">Bibliothèque</h1>
        <Button onClick={() => navigate('/Profile')}>
          <Image src={user.photoURL} roundedCircle width={50} height={50} />
        </Button>
      </header>

      <div className="row">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => (
            <div key={book.id} className="col-md-4 mb-4">
              <div className="card" onClick={() => { setSelectedBook(book); setModalVisible(true); }}>
                <img src={book.coverUrl} className="card-img-top" alt={book.name} />
                <div className="card-body">
                  <h5 className="card-title">{book.name}</h5>
                  <Button variant="danger" onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(book.name); }}>
                    Retirer des favoris
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>Aucun livre favori trouvé.</p>
        )}
      </div>

      {selectedBook && (
        <Modal show={isModalVisible} onHide={() => setModalVisible(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{selectedBook.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Button variant="primary" onClick={() => navigate('/PdfViewer', { state: { pdfUrl: selectedBook.pdfUrl } })}>
              Lire
            </Button>
          </Modal.Body>
        </Modal>
      )}

      {/* Bottom Navigation (Mobile First) */}
      <div style={{
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        display: 'flex', 
        justifyContent: 'space-around', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 9999
      }}>
        <button 
          onClick={() => navigate('/homes')} 
          style={{ alignItems: 'center', flex: 1, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'center' }}
        >
          <Home size={24} color='#000' />
          <p style={{ color: '#000', fontSize: 11 }}>Accueil</p>
        </button>

        <button 
          onClick={() => navigate('/discover')} 
          style={{ alignItems: 'center', flex: 1, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'center' }}
        >
          <Compass size={24} color='#0cc0df' />
          <p style={{ color: '#0cc0df', fontSize: 11 }}>Découvrez</p>
        </button>

        <button 
          onClick={() => {
            if (user) {
              window.open('https://play.google.com/store/apps/details?id=com.seedsoftengine.papers&pcampaignid=web_share', '_blank');
            } else {
              navigate('/login');
            }
          }} 
          style={{ alignItems: 'center', flex: 1, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'center' }}
        >
          <Bookmark size={24} color='#000' />
          <p style={{ color: '#000', fontSize: 11 }}>Bibliothèque</p>
        </button>
      </div>

    </div>
  );
}
