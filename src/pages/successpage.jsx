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
  serverTimestamp,
  runTransaction
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
        if (!bookId || !userId) {
          throw new Error('Paramètres de transaction manquants');
        }

        const decodedBookId = decodeURIComponent(bookId);
        const id_transaction = `TX-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

        // Recherche du livre
        const livresRef = collection(db, 'livres');
        const q = query(livresRef, where('id', '==', decodedBookId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error('Livre non trouvé');
        }

        const bookDoc = querySnapshot.docs[0];
        const bookData = bookDoc.data();

        // Références Firestore
        const userRef = doc(db, 'users', userId);
        const authorRef = doc(db, 'auteurs', bookData.hauteur);

        // Transaction Firestore corrigée
        await runTransaction(db, async (transaction) => {
          // 1. Vérifier si la transaction existe déjà
          const venteQuery = query(
            collection(db, 'ventes_direct'),
            where('id_transaction', '==', id_transaction)
          );
          const venteSnapshot = await getDocs(venteQuery);
          
          // 2. Lire les documents nécessaires
          const userDoc = await transaction.get(userRef);
          const authorDoc = await transaction.get(authorRef);
        
          if (!venteSnapshot.empty) {
            throw new Error('Cette transaction existe déjà');
          }
        
          // 3. Calcul des parts
          const bookPrice = Number(bookData.price);
          const authorShare = Math.round(bookPrice * 0.7); // 70% pour l'auteur (arrondi)
          const platformShare = bookPrice - authorShare; // 30% pour la plateforme
        
          // 4. Préparer les données
          const authorData = authorDoc.data();
          const newAuthorBalance = (authorData.solde || 0) + authorShare;
        
          const newAuthorTransaction = {
            amount: authorShare,
            balance: newAuthorBalance,
            date: new Date(),
            type: "deposit",
            id_transaction,
            fee: platformShare,
            bookId: decodedBookId
          };
        
          // 5. Mises à jour
          // Mise à jour utilisateur
          transaction.update(userRef, {
            buyed: arrayUnion(decodedBookId),
            [`purchasedBooks.${decodedBookId}`]: true
          });
        
          // Mise à jour auteur
          transaction.update(authorRef, {
            solde: newAuthorBalance,
            transactions: arrayUnion(newAuthorTransaction)
          });
        
          // Enregistrement pour la plateforme
          const platformRef = doc(collection(db, 'platform_earnings'));
          transaction.set(platformRef, {
            amount: platformShare,
            bookId: decodedBookId,
            authorId: bookData.hauteur,
            userId: userId,
            date: serverTimestamp(),
            transactionId: id_transaction,
            type: "book_sale",
            originalPrice: bookPrice
          });
        
          // Création de la vente
          const venteRef = doc(collection(db, 'ventes_direct'));
          transaction.set(venteRef, {
            user: userId,
            auteur: bookData.hauteur,
            livre: decodedBookId,
            prix: bookPrice,
            authorEarnings: authorShare,
            platformFee: platformShare,
            date: serverTimestamp(),
            etat: 'reussi',
            moyen: 'OM',
            id_transaction,
            id: `${decodedBookId}_${userId}`
          });
        });
        // Affichage des informations
        setTransactionInfo({
          bookTitle: bookData.name,
          price: bookData.price,
          transactionId: id_transaction,
          authorName: bookData.hauteur
        });

      } catch (err) {
        console.error("Erreur de traitement:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    processTransaction();
  }, [bookId, userId, navigate]);
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <div className="loading-text">Validation de votre transaction...</div>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            background: #f9fafb;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .spinner {
            width: 64px;
            height: 64px;
            border: 8px solid #6366f1;
            border-top: 8px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .loading-text {
            margin-top: 1rem;
            font-size: 1.25rem;
            color: #374151;
          }
        `}</style>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-box">
          <h2>Erreur de transaction</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/contact')}>Contacter le support</button>
        </div>
        <style jsx>{`
          .error-container {
            min-height: 100vh;
            background: #fee2e2;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-box {
            background: #fff;
            border-radius: 8px;
            padding: 2rem;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 90%;
          }
          .error-box h2 {
            color: #dc2626;
            font-size: 1.5rem;
            margin: 0 0 1rem;
          }
          .error-box p {
            margin: 1rem 0;
            color: #4b5563;
          }
          .error-box button {
            padding: 0.75rem 1.5rem;
            background: #4f46e5;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1rem;
            transition: background 0.3s;
          }
          .error-box button:hover {
            background: #4338ca;
          }
        `}</style>
      </div>
    );
  }
  
  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-header">
          <div className="success-icon">✓</div>
          <h1>Paiement Réussi !</h1>
        </div>
        
        <div className="transaction-details">
          <p>Vous avez acheté : <strong>{transactionInfo?.bookTitle}</strong></p>
          <p>Montant : <strong>{transactionInfo?.price} FCFA</strong></p>
          <p>Auteur : <strong>{transactionInfo?.authorName}</strong></p>
          <p className="transaction-id">
            Référence : {transactionInfo?.transactionId}
          </p>
        </div>
  
        <div className="buttons">
          <button 
            className="btn primary" 
            onClick={() => navigate('/biblio')}
          >
            Accéder à ma bibliothèque
          </button>
          <button 
            className="btn secondary" 
            onClick={() => navigate('/')}
          >
            Retour à l'accueil
          </button>
        </div>
  
        <div className="footer">
          <p>Un problème ? <a href="mailto:support@papers.cm">Contactez-nous</a></p>
        </div>
      </div>
  
      <style jsx>{`
        .success-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f9fafb, #f3f4f6);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }
        .success-card {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          max-width: 450px;
          width: 100%;
          padding: 2rem;
          text-align: center;
        }
        .success-header {
          margin-bottom: 1.5rem;
        }
        .success-icon {
          background: #dcfce7;
          color: #10b981;
          font-size: 4rem;
          width: 80px;
          height: 80px;
          line-height: 80px;
          border-radius: 50%;
          margin: 0 auto 1rem;
          animation: bounce 0.8s infinite alternate;
        }
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-10px); }
        }
        .success-card h1 {
          font-size: 1.8rem;
          color: #10b981;
          margin: 0;
        }
        .transaction-details {
          margin: 1.5rem 0;
          text-align: left;
          padding: 0 1rem;
        }
        .transaction-details p {
          margin: 0.5rem 0;
          color: #4b5563;
        }
        .transaction-id {
          font-size: 0.85rem;
          color: #6b7280;
          margin-top: 1rem !important;
          word-break: break-all;
        }
        .buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin: 2rem 0 1rem;
        }
        .btn {
          padding: 0.75rem;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          border: none;
          transition: all 0.3s;
        }
        .btn.primary {
          background: #4f46e5;
          color: #fff;
        }
        .btn.primary:hover {
          background: #4338ca;
        }
        .btn.secondary {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #374151;
        }
        .btn.secondary:hover {
          background: #f9fafb;
        }
        .footer {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
          font-size: 0.85rem;
          color: #6b7280;
        }
        .footer a {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default SuccessPage;
