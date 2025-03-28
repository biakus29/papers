import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAppContext } from '../AppContext';
import { Button, Modal, Image, ProgressBar } from 'react-bootstrap';
import { onAuthStateChanged } from 'firebase/auth';
import 'bootstrap/dist/css/bootstrap.min.css';
import logo from './assets/images/logo.png';
import { Home, Compass, Bookmark,BookOpen } from 'react-feather';

export default function Bibliothèque() {
  const { sharedState } = useAppContext();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [userPurchasedBooks, setUserPurchasedBooks] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const isUserLoggedIn = Boolean(auth.currentUser);
  
  // Loader personnalisé avec logo
  const Loader = () => (
    <div style={{
      minHeight: '100vh', 
      background: '#f9fafb',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center'
    }}>
      <Image src={logo} width={120} className="mb-3" />
      <ProgressBar animated now={100} style={{ width: '80%', height: '10px' }} />
      <p style={{ marginTop: 20, fontSize: '1.25rem', color: '#374151' }}>
        Chargement en cours...
      </p>
    </div>
  );
  
  // Récupérer les informations utilisateur
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          // Récupérer les livres achetés (buyed)
          setUserPurchasedBooks(userDoc.data().buyed || []);
        } else {
          console.error("L'utilisateur n'existe pas dans Firestore.");
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Récupérer tous les livres
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

  // Filtrer les livres achetés par l'utilisateur
  const purchasedBooks = books.filter(book => 
    userPurchasedBooks.includes(book.id) ||
    userPurchasedBooks.includes(book.name)
  );

  if (loading) return <Loader />;

  if (!user) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100">
        <Image src={logo} className="mb-3" width={120} />
        <p>Veuillez vous connecter pour accéder à votre bibliothèque.</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      {/* Header */}
      <header className="d-flex justify-content-between align-items-center py-3 border-bottom">
        <h1 className="h2">Ma Bibliothèque</h1>
        <Button onClick={() => navigate('/Profile')} variant="light" className="p-0 border-0">
          <Image src={user.photoURL || logo} roundedCircle width={50} height={50} />
        </Button>
      </header>

      {/* Liste des livres achetés */}
      <div className="row mt-4">
        {purchasedBooks.length > 0 ? (
          purchasedBooks.map(book => (
            <div key={book.id} className="col-md-4 mb-4">
              <div 
                className="card h-100" 
                style={{ cursor: 'pointer' }} 
                onClick={() => { setSelectedBook(book); setModalVisible(true); }}
              >
                <img src={book.coverUrl} className="card-img-top" alt={book.name} style={{ objectFit: 'cover', height: '250px' }} />
                <div className="card-body">
                  <h5 className="card-title">{book.name}</h5>
                  <p className="card-text text-success">Acheté</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <p>Aucun livre acheté pour le moment.</p>
            <Button variant="primary" onClick={() => navigate('/discover')}>
              Découvrir des livres
            </Button>
          </div>
        )}
      </div>

      {/* Modal pour afficher le livre sélectionné */}
      {selectedBook && (
        <Modal show={isModalVisible} onHide={() => setModalVisible(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>{selectedBook.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="d-flex flex-column align-items-center">
            <Image src={selectedBook.coverUrl} fluid style={{ maxHeight: '300px', marginBottom: '1rem' }} />
            <Button 
                variant="primary" 
                onClick={() => window.open('https://play.google.com/store/apps/details?id=com.seedsoftengine.papers&pcampaignid=web_share', '_blank')}
              >
                Lire ce livre
              </Button>

          </Modal.Body>
        </Modal>
      )}

      {/* Bottom Navigation */}
      <div style={{
      padding: "10px 0",
      display: 'flex',
      justifyContent: 'space-between',
      borderTopColor: '#E0E0E0',
      backgroundColor: '#f0f0f0',
      position: 'fixed',  // Ajout de la position fixe
      bottom: 0,          // Alignement en bas
      left: 0,           // Alignement à gauche
      right: 0,          // Alignement à droite
      zIndex: 1000       // Pour s'assurer que ça soit au-dessus d'autres éléments
    }}>
      <button onClick={() => navigate('/homes')} style={{ alignItems: 'center', flex: 1, border: 'none' }}>
        <Home size={24} color='#000' />
        <p style={{ color: '#000',fontSize:11 }}>Accueil</p>
      </button>
      
      <button onClick={() => navigate('/discover')} style={{ alignItems: 'center', flex: 1, border: 'none' }}>
        <Compass size={24} />
        <p style={{ color: '#000',fontSize:11 }}>Découvrez</p>
      </button>
      <button onClick={() => navigate('/biblio')} style={{ alignItems: 'center', flex: 1, border: 'none' }}>
        <BookOpen size={24} color='#0cc0df' />
        <p style={{ color: '#0cc0df',fontSize:11 }}>bibliothèque</p>
      </button>
      <button 
  onClick={() => {
    if (isUserLoggedIn) {
      // Redirection vers le Play Store
      navigate('/profile');
    } else {
      // Redirection vers la page de connexion
      navigate('/login')
    }
  }} 
  style={{ alignItems: 'center', flex: 1, border: 'none', background: 'none', cursor: 'pointer' }}
>
  <Bookmark size={24} />
  <p style={{ color: '#000', fontSize: 11 }}>profile</p>
</button>

    </div>

    </div>
  );
}
