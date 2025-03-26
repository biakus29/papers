import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  increment,
  addDoc,
  collection,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processTransaction = async () => {
      try {
        // 1. Récupérer les paramètres de l'URL (seulement bookId et userId)
        const searchParams = new URLSearchParams(location.search);
        const bookId = searchParams.get('bookId');
        const userId = searchParams.get('userId');

        if (!bookId || !userId) {
          throw new Error('Paramètres de transaction manquants');
        }

        // 2. Récupérer les détails du livre et de l'auteur
        const bookDoc = await getDoc(doc(db, 'livres', bookId));
        if (!bookDoc.exists()) throw new Error('Livre non trouvé');
        const bookData = bookDoc.data();
        const authorId = bookData.hauteur;

        const authorDoc = await getDoc(doc(db, 'auteurs', authorId));
        if (!authorDoc.exists()) throw new Error('Auteur non trouvé');

        // Le prix est récupéré depuis bookData.price
        const price = parseInt(bookData.price, 10);

        // 3. Préparer les données de transaction
        const transactionData = {
          amount: price,
          balance: authorDoc.data().solde + price,
          date: serverTimestamp(),
          id_transaction: `MP${new Date().getDate()}${new Date().getMonth()+1}${new Date().getFullYear().toString().substr(-2)}.${Math.floor(Math.random()*90000)+10000}`,
          type: 'book_purchase'
        };

        // 4. Mise à jour Firestore
        await Promise.all([
          // Mise à jour de l'utilisateur
          updateDoc(doc(db, 'users', userId), {
            buyed: arrayUnion(bookId),
            lastPurchase: serverTimestamp()
          }),
          // Mise à jour de l'auteur
          updateDoc(doc(db, 'auteurs', authorId), {
            solde: increment(price),
            totalVentes: increment(1),
            transactions: arrayUnion(transactionData)
          }),
          // Enregistrement de la vente
          addDoc(collection(db, 'ventes_direct'), {
            user: userId,
            auteur: authorId,
            livre: bookId,
            prix: price,
            date: serverTimestamp(),
            etat: 'réussi',
            moyen: 'mobile_money',
            transaction_id: transactionData.id_transaction
          })
        ]);
      } catch (err) {
        console.error("Erreur de traitement:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    processTransaction();
  }, [location.search]);

  if (loading) {
    return (
      <>
        <style>{`
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
        <div className="loading-container">
          <div className="spinner"></div>
          <div className="loading-text">Validation de votre transaction...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{`
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
          }
          .error-box h2 {
            color: #dc2626;
            font-size: 1.5rem;
            margin: 0;
          }
          .error-box p {
            margin: 1rem 0;
            color: #4b5563;
          }
          .error-box button {
            padding: 0.75rem 1rem;
            background: #4f46e5;
            color: #fff;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background 0.3s;
          }
          .error-box button:hover {
            background: #4338ca;
          }
        `}</style>
        <div className="error-container">
          <div className="error-box">
            <h2>Erreur de transaction</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/contact')}>Contacter le support</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
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
          max-width: 400px;
          width: 100%;
          padding: 2rem;
          text-align: center;
          transition: transform 0.3s;
        }
        .success-card:hover {
          transform: scale(1.03);
        }
        .success-header {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .success-icon {
          background: #dcfce7;
          color: #10b981;
          font-size: 4rem;
          width: 80px;
          height: 80px;
          line-height: 80px;
          border-radius: 50%;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        .success-card h1 {
          font-size: 2rem;
          color: #10b981;
          margin: 0;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        .success-message {
          margin: 1rem 0;
          color: #4b5563;
        }
        .buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1rem;
        }
        .btn {
          padding: 0.75rem 1rem;
          border-radius: 5px;
          font-size: 1rem;
          cursor: pointer;
          border: none;
          transition: background 0.3s;
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
          font-size: 0.75rem;
          color: #6b7280;
        }
        .footer a {
          color: #4f46e5;
          text-decoration: none;
        }
      `}</style>
      <div className="success-container">
        <div className="success-card">
          <div className="success-header">
            <div className="success-icon">✓</div>
            <h1>Paiement Réussi !</h1>
          </div>
          <p className="success-message">Votre paiement a été enregistré.</p>
          <div className="buttons">
            <button className="btn primary" onClick={() => navigate('/biblio')}>Accéder à ma bibliothèque</button>
            <button className="btn secondary" onClick={() => navigate('/')}>Retour à l'accueil</button>
          </div>
          <div className="footer">
            <p>Un problème ? <a href="mailto:support@papers.cm">Contactez-nous</a></p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuccessPage;
