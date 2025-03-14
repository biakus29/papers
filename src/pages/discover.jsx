import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, orderBy, limit,where } from 'firebase/firestore';
import { auth } from '../firebase';
import { Spinner, Container, Row, Col, Card } from 'react-bootstrap';
import logo from './assets/images/logo.png';
import './assets/css/DiscoverScreen.css';
import SearchBar from './SearchBar';
import { Home, Compass, Bookmark  } from 'react-feather'


export default function DiscoverScreen() {
  const [categoriesBook, setCategoriesBook] = useState([]);
  const [books, setBooks] = useState([]);
  const [bestBooks, setBestBooks] = useState([]);
  const [mostRead, setMostRead] = useState([]);
  const [freeBooks, setFreeBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCovers, setLoadingCovers] = useState(true);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const isUserLoggedIn = Boolean(auth.currentUser);
  const navigateToLogin = () => {
    window.location.href = '/login'; // Chemin de votre page de connexion
  };
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const firestore = getFirestore();

        // Fetch Books
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
        const freeBooksCollection = query(
          collection(firestore, 'livres'),
          where('price', '==', 0) // Condition pour récupérer les livres gratuits
        );
        const freeBooksSnapshot = await getDocs(freeBooksCollection);
        const freeBooksList = freeBooksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFreeBooks(freeBooksList);


        // Fetch Categories
        const categoriesCollection = collection(firestore, 'catégories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategoriesBook(categoriesList);

        // Fetch Top Viewed Books
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

        // Fetch Top Rated Books
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
        <div className="text-center" style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
          <img src={logo} className="logo" alt="logo" />
          <Spinner animation="border" variant="primary" style={{marginTop:11}} />
        </div>
      </Container>
    );
  }

  return (
    <Container style={{padding:0}}>
        {/* <nav className="navbar navbar-expand-lg fixed-top shadow-sm  mb-7">
          <a className="navbar-brand" href="/">
            <img src={logo} alt="Logo" className="rounded-circle"  />
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link active" href="./homes">Accueil</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/discover">Découvrez</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/biblio">Bibliothèque</a>
              </li>
            </ul>
          </div>
        </nav> */}
        <nav style={{
        height: 80, 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'white', // Optionnel pour donner un fond lorsqu'il est sticky
        zIndex: 1000,  // Optionnel pour s'assurer que le nav reste au-dessus des autres éléments
        padding:8 // Optionnel pour un effet d'ombre
      }}>
        <p style={{fontSize: 24, fontWeight: 'bold',marginTop:15}}>Découverte</p>
        <p style={{border: "1px solid black", width: 70, borderColor: "#0cc0df", marginTop: -15,borderWidth:2,borderRadius:50}}></p>
      </nav>

      <div className="" style={{justifyContent:'center'}}>
        <div className="mb-4 my-4" style={{display:"flex",justifyContent:'center', alignItems:'center',marginVertical:20,width:"100%"}}>
          <SearchBar books={books} onBookPress={handlePress}/>
        </div>
        <div className="section mb-4">
          <h2 className="d-flex justify-content-start" style={{marginLeft:8, textDecoration: 'none', borderBottom: 'none' }}>Nouveautés</h2>
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
                      style={{ width: '150px', height: '225px', objectFit: 'cover' }} // Utiliser 'cover' pour s'assurer que les images remplissent le conteneur
                    />
                    <p style={{ maxWidth: '100px', fontSize: '12px' }} className="mt-2 text-dark">{truncateTitle(book.name)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
                style={{ width: '150px', height: '225px', objectFit: 'cover' }} // Utiliser 'cover' pour s'assurer que les images remplissent le conteneur
              />
              <p style={{ maxWidth: '100px', fontSize: '12px' }} className="mt-2 text-dark">{truncateTitle(book.name)}</p>
            </div>
          </div>
        ))}
    </div>
  </div>
</div>


        <div className="section mb-4">
  <h2 className=" d-flex justify-content-start" style={{ textDecoration: 'none', borderBottom: 'none',marginLeft:8 }}>Les Plus Populaires</h2>
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
              style={{ width: '150px', height: '225px', objectFit: 'cover' }} // Utiliser 'cover' pour s'assurer que les images remplissent le conteneur
            />
            <p style={{ maxWidth: '100px', fontSize: '12px' }} className="mt-2 text-dark">{truncateTitle(book.name)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

<div className="section mb-4">
  <h2 className=" d-flex justify-content-start" style={{ marginLeft:8,textDecoration: 'none', borderBottom: 'none' }}>Les Mieux Notés</h2>
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
              style={{ width: '150px', height: '225px', objectFit: 'cover' }} // Utiliser 'cover' pour s'assurer que les images remplissent le conteneur
            />
            <p style={{ maxWidth: '100px', fontSize: '12px' }} className="mt-2 text-dark">{truncateTitle(book.name)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

<div className="section mb-4">
  <h2 className=" d-flex justify-content-start" style={{marginLeft:8}}>Nos Catégories</h2>
  <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0',height:150 }}>
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
             <Home size={24} color='#0cc0df' />
             <p style={{ color: '#0cc0df',fontSize:11 }}>Accueil</p>
           </button>
           <button onClick={() => navigate('/discover')} style={{ alignItems: 'center', flex: 1, border: 'none' }}>
             <Compass size={24} />
             <p style={{ color: '#000',fontSize:11 }}>Découvrez</p>
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