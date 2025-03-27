import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getDocs,
  doc,
  collection,
  query,
  where,
  updateDoc,
  arrayUnion,
  increment,
  addDoc,
  serverTimestamp,
  runTransaction,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const SuccessPage = () => {
  const { bookId, userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactionInfo, setTransactionInfo] = useState(null);

  useEffect(() => {
    const processTransaction = async () => {
      try {
        // Validation des paramètres
        if (!bookId || !userId) {
          throw new Error('Paramètres de transaction manquants');
        }

        const decodedBookId = decodeURIComponent(bookId);

        // 1. Récupération du livre
        const livresRef = collection(db, 'livres');
        const q = query(livresRef, where('id', '==', decodedBookId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('Livre non trouvé');
        }

        const bookDoc = querySnapshot.docs[0];
        const bookData = bookDoc.data();
        const transactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

        // 2. Transaction atomique pour toutes les opérations
        await runTransaction(db, async (transaction) => {
          // Références
          const userRef = doc(db, 'users', userId);
          const authorRef = doc(db, 'auteurs', bookData.hauteur);
          const venteRef = doc(collection(db, 'ventes_direct'));

          // Lecture des données actuelles
          const [userSnap, authorSnap] = await Promise.all([
            getDoc(userRef),
            getDoc(authorRef)
          ]);

          // Validation
          if (!userSnap.exists() || !authorSnap.exists()) {
            throw new Error('Utilisateur ou auteur introuvable');
          }

          const amount = Number(bookData.price);
          if (isNaN(amount)) {
            throw new Error(`Prix invalide: ${bookData.price}`);
          }

          // Vérification des doublons
          const existingTx = authorSnap.data().transactions?.some(
            tx => tx.transactionId === transactionId
          );

          if (existingTx) {
            throw new Error('Transaction déjà existante');
          }

          // Calculs
          const currentBalance = authorSnap.data().solde || 0;
          const newBalance = currentBalance + amount;

          // Mises à jour
          transaction.update(userRef, {
            buyed: arrayUnion(decodedBookId),
            [`purchasedBooks.${decodedBookId}`]: true,
            lastPurchase: serverTimestamp()
          });

          transaction.update(authorRef, {
            solde: newBalance,
            transactions: arrayUnion({
              amount,
              previousBalance: currentBalance,
              newBalance,
              date: serverTimestamp(),
              bookId: decodedBookId,
              userId,
              transactionId,
              type: "sale"
            }),
            "metadata.lastUpdated": serverTimestamp(),
            "metadata.totalSales": increment(1)
          });

          transaction.set(venteRef, {
            user: userId,
            auteur: bookData.hauteur,
            livre: decodedBookId,
            prix: amount,
            date: serverTimestamp(),
            etat: 'reussi',
            moyen: 'OM',
            transactionId
          });
        });

        // Stockage des infos pour l'affichage
        setTransactionInfo({
          bookTitle: bookData.name,
          price: bookData.price,
          transactionId,
          authorName: bookData.hauteur
        });

      } catch (err) {
        console.error("Erreur de traitement:", err);
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    processTransaction();
  }, [bookId, userId, navigate]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>Validation de votre transaction...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorBox}>
          <h2 style={styles.errorTitle}>Erreur de transaction</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button 
            style={styles.contactButton}
            onClick={() => navigate('/contact')}
          >
            Contacter le support
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.successContainer}>
      <div style={styles.successCard}>
        <div style={styles.successHeader}>
          <div style={styles.successIcon}>✓</div>
          <h1 style={styles.successTitle}>Paiement Réussi !</h1>
        </div>
        
        <div style={styles.transactionDetails}>
          <p style={styles.detailItem}>
            Vous avez acheté : <strong>{transactionInfo?.bookTitle}</strong>
          </p>
          <p style={styles.detailItem}>
            Montant : <strong>{transactionInfo?.price} FCFA</strong>
          </p>
          <p style={styles.detailItem}>
            Auteur : <strong>{transactionInfo?.authorName}</strong>
          </p>
          <p style={styles.transactionId}>
            Référence : {transactionInfo?.transactionId}
          </p>
        </div>

        <div style={styles.buttons}>
          <button 
            style={styles.primaryButton}
            onClick={() => navigate('/biblio')}
          >
            Accéder à ma bibliothèque
          </button>
          <button 
            style={styles.secondaryButton}
            onClick={() => navigate('/')}
          >
            Retour à l'accueil
          </button>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Un problème ? <a href="mailto:support@papers.cm" style={styles.footerLink}>Contactez-nous</a>
          </p>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  loadingContainer: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '64px',
    height: '64px',
    border: '8px solid #6366f1',
    borderTop: '8px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    fontSize: '1.25rem',
    color: '#374151',
  },
  errorContainer: {
    minHeight: '100vh',
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '2rem',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '90%',
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: '1.5rem',
    margin: '0 0 1rem',
  },
  errorMessage: {
    margin: '1rem 0',
    color: '#4b5563',
  },
  contactButton: {
    padding: '0.75rem 1.5rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background 0.3s',
  },
  successContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  successCard: {
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    maxWidth: '450px',
    width: '100%',
    padding: '2rem',
    textAlign: 'center',
  },
  successHeader: {
    marginBottom: '1.5rem',
  },
  successIcon: {
    background: '#dcfce7',
    color: '#10b981',
    fontSize: '4rem',
    width: '80px',
    height: '80px',
    lineHeight: '80px',
    borderRadius: '50%',
    margin: '0 auto 1rem',
    animation: 'bounce 0.8s infinite alternate',
  },
  successTitle: {
    fontSize: '1.8rem',
    color: '#10b981',
    margin: 0,
  },
  transactionDetails: {
    margin: '1.5rem 0',
    textAlign: 'left',
    padding: '0 1rem',
  },
  detailItem: {
    margin: '0.5rem 0',
    color: '#4b5563',
  },
  transactionId: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginTop: '1rem !important',
    wordBreak: 'break-all',
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: '2rem 0 1rem',
  },
  primaryButton: {
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.3s',
    background: '#4f46e5',
    color: '#fff',
  },
  secondaryButton: {
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'pointer',
    border: '1px solid #d1d5db',
    color: '#374151',
    background: 'transparent',
  },
  footer: {
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb',
    fontSize: '0.85rem',
    color: '#6b7280',
  },
  footerText: {
    margin: 0,
  },
  footerLink: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: 500,
  },
  '@keyframes spin': {
    to: { transform: 'rotate(360deg)' },
  },
  '@keyframes bounce': {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(-10px)' },
  },
};

export default SuccessPage;