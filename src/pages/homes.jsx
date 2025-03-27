import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db,auth } from '../firebase';
import { Carousel, Spinner, Button, ListGroup, Container } from 'react-bootstrap';
import './assets/css/stylehome.css';
import { collection, getDocs } from 'firebase/firestore';
import logo from './assets/images/logo.png';
import { Home, Compass, Bookmark, BookOpen  } from 'react-feather'




export default function Homes() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [navbarVisible, setNavbarVisible] = useState(true);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const isUserLoggedIn = Boolean(auth.currentUser);


  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksCollection = collection(db, 'livres');
        const booksSnapshot = await getDocs(booksCollection);
        const booksList = booksSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(book => book.verdict === 'accepted');
        setBooks(booksList);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors de la récupération des livres : ", error);
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % books.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [books]);

  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setNavbarVisible(scrollTop < lastScrollTop || scrollTop < 100);
      lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePress = (bookId) => {
    navigate(`/book/${bookId}`);
  };

  const handleButtonClick = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const truncateTitle = (title, maxLength = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

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

  const genres = [...new Set(books.map(book => book.genre))];

  return (
    <div className="banner">
     
      <nav style={{
        height: 70, 
        alignItems: 'center', 
        justifyContent: 'center', 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'white', // Optionnel pour donner un fond lorsqu'il est sticky
        zIndex: 1000,  // Optionnel pour s'assurer que le nav reste au-dessus des autres éléments
        boxShadow: '0 4px 2px -2px lightgray', 
        padding:8 // Optionnel pour un effet d'ombre
      }}>
        <p style={{fontSize: 24, fontWeight: 'bold'}}>Accueil</p>
        <p style={{border: "1px solid black", width: 70, borderColor: "#0cc0df", marginTop: -15,borderWidth:2,borderRadius:50}}></p>
      </nav>

      <div className="carousel-container" style={{ background: 'none' }}>
  <Carousel
    activeIndex={currentIndex}
    onSelect={(selectedIndex) => setCurrentIndex(selectedIndex)}
    className="mb-0 mx-auto"
    style={{ maxWidth: '100%', background: 'none' }}
  >
    {books && books.filter(book => book.inCaroussel === "yes").length > 0 ? (
      books
        .filter(book => book.inCaroussel === "yes")
        .map((book) => (
          <Carousel.Item key={book.id} onClick={() => handlePress(book.id)}>
            <div className="d-flex justify-content-center" style={{ background: 'none' }}>
              <img
                src={book.coverUrl}
                alt={`Couverture de ${book.name}`}
                className="d-block"
                style={{
                  width: '100%',
                  height: '500px',
                  objectFit: 'cover',
                  background: 'none',
                }}
              />
            </div>
          </Carousel.Item>
        ))
    ) : (
      <Carousel.Item>
        <div className="text-center">
          <p>Aucun livre disponible dans le carrousel.</p>
        </div>
      </Carousel.Item>
    )}
  </Carousel>
</div>


      <section className="section categories-section mt-0">
        <div className="categories mt-4">
          {genres.map(genre => (
            <div className="mb-4" key={genre}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 style={{fontSize:22}}>{genre}</h2>
                <Button variant="link" onClick={() => navigate('/CategoryDetail', { state: { category: genre } })} style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  <i className="fas fa-chevron-right" style={{ fontSize: '18px', marginLeft: '5px',color:'black' }}></i>
                </Button>
              </div>
              <ListGroup className="d-grid gap-3 p-0 m-0" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
  {books
    .filter(book => book.genre === genre)
    .slice(0, 12) // Limiter à 12 livres
    .map(item => (
      <ListGroup.Item 
        key={item.id} 
        onClick={() => handlePress(item.id)} 
        className="d-flex flex-column align-items-center p-0 m-2 border-0 bg-transparent"
      >
        <img 
          src={item.coverUrl} 
          alt={item.name} 
          className="img-fluid" 
          style={{ width: '115px', height: '140px', objectFit: 'cover' }} 
        />
        <p style={{fontSize:12}} className="mt-2 text-dark">{truncateTitle(item.name)}</p>
      </ListGroup.Item>
    ))}
</ListGroup>

            </div>
          ))}
        </div>
      </section>
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
      <button onClick={() => navigate('/biblio')} style={{ alignItems: 'center', flex: 1, border: 'none' }}>
        <BookOpen size={24} color='#000' />
        <p style={{ color: '#000',fontSize:11 }}>bibliothèque</p>
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
    </div>
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