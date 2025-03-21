import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Image, Button, Alert, Spinner, Card } from 'react-bootstrap';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { FaChevronLeft, FaHome, FaCompass, FaBookmark } from 'react-icons/fa';

const Profile = () => {
  const { sharedState, setSharedState } = useAppContext();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Récupération des informations utilisateur depuis Firebase
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUser({ id: currentUser.uid, ...userDoc.data() });
            fetchTransactions(currentUser.uid);
          } else {
            console.error("L'utilisateur n'existe pas dans Firestore.");
          }
        }
      } catch (err) {
        setError('Échec du chargement des données utilisateur');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSharedState((prevState) => ({ ...prevState, user: null }));
      navigate('/login');
    } catch (err) {
      setError('Erreur lors de la déconnexion');
    }
  };

  const fetchTransactions = async (userId) => {
    try {
      const q = query(collection(db, 'ventes_direct'), where('user', '==', userId));
      const querySnapshot = await getDocs(q);
      const fetchedTransactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(fetchedTransactions);
    } catch (err) {
      setError('Échec du chargement des transactions');
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="px-3" style={{ maxWidth: '500px' }}>
      <Row className="pt-3 align-items-center">
        <Col xs={2}>
          <Button variant="link" onClick={() => navigate('/homes')}>
            <FaChevronLeft size={24} />
          </Button>
        </Col>
        <Col xs={8} className="text-center">
          <h5 className="mb-0">Mon Profil</h5>
        </Col>
        <Col xs={2}></Col>
      </Row>

      <Card className="mt-3 shadow-sm">
        <Card.Body className="text-center">
          <Image 
            src={user.image} 
            roundedCircle 
            width={120} 
            height={120} 
            className="mb-3" 
            style={{ objectFit: 'cover' }} 
          />
          <h4>{user.uname}</h4>
          <p className="text-muted">{user.adresse}</p>
          <Button variant="outline-danger" onClick={handleLogout}>
            Déconnexion
          </Button>
        </Card.Body>
      </Card>

      <Row className="mt-4">
        <Col xs={4} className="text-center">
          <Button variant="light" onClick={() => navigate('/homes')} className="w-100">
            <FaHome size={20} />
            <div style={{ fontSize: '0.75rem' }}>Accueil</div>
          </Button>
        </Col>
        <Col xs={4} className="text-center">
          <Button variant="light" onClick={() => navigate('/discover')} className="w-100">
            <FaCompass size={20} />
            <div style={{ fontSize: '0.75rem' }}>Découvrez</div>
          </Button>
        </Col>
        <Col xs={4} className="text-center">
          <Button variant="light" onClick={() => navigate('/biblio')} className="w-100">
            <FaBookmark size={20} />
            <div style={{ fontSize: '0.75rem' }}>Bibliothèque</div>
          </Button>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12}>
          <h6 className="mb-3">Mes Transactions :</h6>
          {transactions.length > 0 ? (
            transactions.map((transac) => (
              <Card key={transac.id} className="mb-2">
                <Card.Body>
                  <h6>Livre : {transac.livre}</h6>
                  <p>Prix : {transac.prix} FCFA</p>
                  <p>Moyen : {transac.moyen}</p>
                  <p>État : {transac.etat}</p>
                  <td>{transac.date?.toDate().toLocaleString()}</td>

                </Card.Body>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted">Aucune transaction enregistrée.</p>
          )}
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12} className="mb-3">
          <Card 
            className="shadow-sm" 
            onClick={() => navigate('/create-editor')} 
            style={{ cursor: 'pointer' }}
          >
            <Card.Body className="text-center">
              <h5 className="mb-1">Devenir Éditeur</h5>
              <small className="text-muted">Créez un compte pour gérer vos publications</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12}>
          <Card 
            className="shadow-sm" 
            onClick={() => navigate('/create-author')} 
            style={{ cursor: 'pointer' }}
          >
            <Card.Body className="text-center">
              <h5 className="mb-1">Devenir Auteur</h5>
              <small className="text-muted">Créez un compte pour publier vos œuvres</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
