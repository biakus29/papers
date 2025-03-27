import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Image, Button, Alert, Spinner, Card, Tabs, Tab, Badge, Modal } from 'react-bootstrap';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import { FaChevronLeft, FaHome, FaCompass, FaBookmark, FaPlus, FaQuestionCircle } from 'react-icons/fa';

const SafeImage = ({ src, alt, ...props }) => {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      onError={() => setImgSrc('https://via.placeholder.com/150')}
      {...props}
    />
  );
};

const Profile = () => {
  const { setSharedState } = useAppContext();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [visibleTransactions, setVisibleTransactions] = useState(5);
  const [activeTab, setActiveTab] = useState('all');
  const [showEnCoursModal, setShowEnCoursModal] = useState(false);
  const [selectedEnCoursTransaction, setSelectedEnCoursTransaction] = useState(null);

  const loadMoreTransactions = () => {
    setVisibleTransactions(prev => prev + 5);
  };

  const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'en cours':
        return 'warning';
      case 'completé':
        return 'success';
      case 'annulé':
        return 'danger';
      default:
        return 'info';
    }
  };

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
      const q = query(
        collection(db, "ventes_direct"), 
        where("user", "==", userId)
      );
      const querySnapshot = await getDocs(q);

      const fetchedTransactions = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const transac = { id: docSnap.id, ...docSnap.data() };

          transac.moyen = transac.moyen === "_" ? "Non spécifié" : transac.moyen;
          
          if (transac.date && typeof transac.date.toDate === 'function') {
            transac.formattedDate = transac.date.toDate().toLocaleString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else {
            transac.formattedDate = "Date non disponible";
          }

          if (transac.livre) {
            try {
              const livreRef = doc(db, "livres", transac.livre);
              const livreSnap = await getDoc(livreRef);
              
              if (livreSnap.exists()) {
                const livreData = livreSnap.data();
                transac.nomLivre = livreData.name || livreData.titre || "Livre sans nom";
                transac.imageLivre = livreData.image || 
                                   livreData.coverUrl || 
                                   livreData.cover || 
                                   'https://via.placeholder.com/60';
                
                if (transac.imageLivre && !transac.imageLivre.startsWith('http')) {
                  transac.imageLivre = 'https://via.placeholder.com/60';
                }
              } else {
                transac.nomLivre = "Livre inconnu";
                transac.imageLivre = 'https://via.placeholder.com/60';
              }
            } catch (error) {
              console.error("Erreur lors de la récupération du livre:", error);
              transac.nomLivre = "Erreur de chargement";
              transac.imageLivre = 'https://via.placeholder.com/60';
            }
          } else {
            transac.nomLivre = "ID livre manquant";
            transac.imageLivre = 'https://via.placeholder.com/60';
          }
          return transac;
        })
      );

      setTransactions(fetchedTransactions);
    } catch (err) {
      setError("Échec du chargement des transactions");
      console.error("Erreur dans fetchTransactions:", err);
    }
  };

  const uniqueStatuses = Array.from(new Set(transactions.map(t => t.etat)));

  const filterTransactionsByStatus = (status) => {
    if (status === 'all') return transactions;
    return transactions.filter(t => t.etat === status);
  };

  const getVisibleTransactions = (status) => {
    const filtered = filterTransactionsByStatus(status);
    return filtered.slice(0, visibleTransactions);
  };

  const handleEnCoursClick = (transac) => {
    setSelectedEnCoursTransaction(transac);
    setShowEnCoursModal(true);
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

  if (!user) {
    return (
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Alert variant="warning">Utilisateur non trouvé.</Alert>
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
          <h4 className="mb-0">Mon Profil</h4>
        </Col>
        <Col xs={2} className="d-flex justify-content-end">
          <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
            Déconnexion
          </Button>
        </Col>
      </Row>

      <Card className="mt-3 shadow-sm">
        <Card.Body className="text-center">
          <SafeImage 
            src={user.image || 'https://via.placeholder.com/120'} 
            roundedCircle 
            width={120} 
            height={120} 
            className="mb-3" 
            style={{ objectFit: 'cover', border: '3px solid #0cc0df' }} 
          />
          <h5 className="mb-1">{user.uname}</h5>
          <p className="text-muted">{user.adresse}</p>
        </Card.Body>
      </Card>

      <Row className="mt-4 text-center">
        <Col>
          <Button variant="light" onClick={() => navigate('/homes')} className="w-100">
            <FaHome size={20} />
            <div style={{ fontSize: '0.75rem' }}>Accueil</div>
          </Button>
        </Col>
        <Col>
          <Button variant="light" onClick={() => navigate('/discover')} className="w-100">
            <FaCompass size={20} />
            <div style={{ fontSize: '0.75rem' }}>Découvrez</div>
          </Button>
        </Col>
        <Col>
          <Button variant="light" onClick={() => navigate('/biblio')} className="w-100">
            <FaBookmark size={20} />
            <div style={{ fontSize: '0.75rem' }}>Bibliothèque</div>
          </Button>
        </Col>
      </Row>

      <hr className="my-4" />

      <Row>
        <Col xs={12}>
          <h6 className="mb-3">Mes Transactions :</h6>
          <Tabs defaultActiveKey="all" id="transaction-tabs" className="mb-3">
            <Tab eventKey="all" title="Tous">
              {getVisibleTransactions("all").length > 0 ? (
                <>
                  {getVisibleTransactions("all").map((transac) => (
                    <Card 
                      key={transac.id} 
                      className="mb-3 shadow-sm"
                      onClick={() => transac.etat === "en cours" && handleEnCoursClick(transac)}
                      style={{ cursor: transac.etat === "en cours" ? "pointer" : "default" }}
                    >
                      <Card.Body className="p-2">
                        <Row className="align-items-center">
                          <Col xs={3} className="pe-0">
                            <SafeImage 
                              src={transac.imageLivre} 
                              rounded 
                              fluid 
                              style={{ width: '60px', height: '80px', objectFit: 'cover' }}
                            />
                          </Col>
                          <Col xs={9}>
                            <Row>
                              <Col xs={8} className="fw-bold text-truncate">
                                {transac.nomLivre}
                              </Col>
                              <Col xs={4} className="text-end">
                                <Badge bg={getStatusBadgeColor(transac.etat)}>
                                  {transac.etat}
                                </Badge>
                              </Col>
                            </Row>
                            <Row className="mt-1">
                              <Col xs={12} className="text-muted small">
                                {transac.formattedDate}
                              </Col>
                            </Row>
                            <Row className="align-items-center mt-2">
                              <Col xs={6} className="fw-bold text-success">
                                {transac.prix} FCFA
                              </Col>
                              <Col xs={6} className="text-end small">
                                <span className={transac.moyen === "Non spécifié" ? "text-muted" : "text-primary"}>
                                  {transac.moyen === "Non spécifié" ? <FaQuestionCircle /> : transac.moyen}
                                </span>
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                  {transactions.length > visibleTransactions && (
                    <div className="text-center mt-3">
                      <Button variant="outline-primary" onClick={loadMoreTransactions}>
                        <FaPlus /> Voir plus
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted">Aucune transaction enregistrée.</p>
              )}
            </Tab>

            {uniqueStatuses.map((status) => (
              <Tab key={status} eventKey={status} title={status}>
                {getVisibleTransactions(status).length > 0 ? (
                  <>
                    {getVisibleTransactions(status).map((transac) => (
                      <Card 
                        key={transac.id} 
                        className="mb-3 shadow-sm"
                        onClick={() => transac.etat === "en cours" && handleEnCoursClick(transac)}
                        style={{ cursor: transac.etat === "en cours" ? "pointer" : "default" }}
                      >
                        <Card.Body className="p-2">
                          <Row className="align-items-center">
                            <Col xs={3} className="pe-0">
                              <SafeImage 
                                src={transac.imageLivre} 
                                rounded 
                                fluid 
                                style={{ width: '60px', height: '80px', objectFit: 'cover' }}
                              />
                            </Col>
                            <Col xs={9}>
                              <Row>
                                <Col xs={8} className="fw-bold text-truncate">
                                  {transac.nomLivre}
                                </Col>
                                <Col xs={4} className="text-end">
                                  <Badge bg={getStatusBadgeColor(transac.etat)}>
                                    {transac.etat}
                                  </Badge>
                                </Col>
                              </Row>
                              <Row className="mt-1">
                                <Col xs={12} className="text-muted small">
                                  {transac.formattedDate}
                                </Col>
                              </Row>
                              <Row className="align-items-center mt-2">
                                <Col xs={6} className="fw-bold text-success">
                                  {transac.prix} FCFA
                                </Col>
                                <Col xs={6} className="text-end small">
                                  <span className={transac.moyen === "Non spécifié" ? "text-muted" : "text-primary"}>
                                    {transac.moyen === "Non spécifié" ? <FaQuestionCircle /> : transac.moyen}
                                  </span>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                    {filterTransactionsByStatus(status).length > visibleTransactions && (
                      <div className="text-center mt-3">
                        <Button variant="outline-primary" onClick={loadMoreTransactions}>
                          <FaPlus /> Voir plus
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted">Aucune transaction pour ce statut.</p>
                )}
              </Tab>
            ))}
          </Tabs>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col xs={12} className="mb-3">
          <Card 
            className="shadow-sm clickable" 
            onClick={() => navigate('/create-editor')} 
            style={{ cursor: 'pointer' }}
          >
            <Card.Body className="text-center">
              <h6 className="mb-1">Devenir Éditeur</h6>
              <small className="text-muted">Gérez vos publications</small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12}>
          <Card 
            className="shadow-sm clickable" 
            onClick={() => navigate('/create-author')} 
            style={{ cursor: 'pointer' }}
          >
            <Card.Body className="text-center">
              <h6 className="mb-1">Devenir Auteur</h6>
              <small className="text-muted">Publiez vos œuvres</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showEnCoursModal} onHide={() => setShowEnCoursModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Transaction en cours</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Vous avez essayé d'acheter le livre "<strong>{selectedEnCoursTransaction?.nomLivre}</strong>".
          </p>
          <p>Que souhaitez-vous faire ?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEnCoursModal(false)}>
            Annuler le paiement
          </Button>
          <Button variant="primary" onClick={() => {
            setShowEnCoursModal(false);
            navigate('/details', { 
              state: { 
                bookId: selectedEnCoursTransaction?.livre,
                bookTitle: selectedEnCoursTransaction?.nomLivre,
                bookImage: selectedEnCoursTransaction?.imageLivre
              } 
            });
          }}>
            Poursuivre le paiement
          </Button>
          <Button variant="warning" onClick={() => {
            alert("Votre réclamation a été envoyée. Merci de votre patience.");
            setShowEnCoursModal(false);
          }}>
            Réclamation
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Profile;