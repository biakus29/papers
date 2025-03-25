import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  increment,
  addDoc,
  collection 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processTransaction = async () => {
      setIsProcessing(true);
      try {
        // 1. Récupérer les paramètres
        const searchParams = new URLSearchParams(location.search);
        const bookId = searchParams.get('bookId');
        const userId = searchParams.get('userId');

        if (!bookId || !userId) {
          throw new Error('Paramètres de transaction manquants');
        }

        // 2. Récupérer le livre
        const bookDoc = await getDoc(doc(db, 'livres', bookId));
        if (!bookDoc.exists()) {
          throw new Error('Livre non trouvé');
        }
        const bookData = bookDoc.data();

        // 3. Mises à jour Firestore
        await Promise.all([
          // Mise à jour utilisateur
          updateDoc(doc(db, 'users', userId), {
            buyed: arrayUnion(bookId),
            lastPurchase: new Date()
          }),
          
          // Mise à jour auteur
          updateDoc(doc(db, 'auteurs', bookData.hauteur), {
            solde: increment(bookData.price),
            totalVentes: increment(1)
          }),
          
          // Enregistrement de la vente
          addDoc(collection(db, 'ventes_direct'), {
            user: userId,
            auteur: bookData.hauteur,
            livre: bookId,
            prix: bookData.price,
            date: new Date(),
            etat: 'réussi',
            moyen: 'mobile_money'
          })
        ]);

        // 4. Préparer les données pour l'affichage
        setTransaction({
          bookTitle: bookData.name,
          bookCover: bookData.coverUrl,
          price: bookData.price,
          date: new Date().toLocaleDateString('fr-FR')
        });

      } catch (err) {
        console.error("Erreur de traitement:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        setIsProcessing(false);
      }
    };

    processTransaction();
  }, [location.search]);

  if (loading || isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h3 className="text-xl font-medium text-gray-700">Traitement de votre achat...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-red-100 text-red-500 text-5xl mb-4 rounded-full w-16 h-16 flex items-center justify-center">
          !
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur de traitement</h2>
        <p className="text-gray-600 mb-6 max-w-md text-center">{error}</p>
        <button
          onClick={() => navigate('/contact')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Contacter le support
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 text-green-500 text-8xl rounded-full w-32 h-32 flex items-center justify-center">
              ✓
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Paiement Réussi !
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Votre achat a été traité avec succès.
          </p>

          {transaction && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-4">
                {transaction.bookCover && (
                  <img 
                    src={transaction.bookCover} 
                    alt={transaction.bookTitle}
                    className="w-16 h-20 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-medium text-gray-900">{transaction.bookTitle}</h3>
                  <p className="text-indigo-600 font-semibold">{transaction.price} XAF</p>
                  <p className="text-sm text-gray-500">Le {transaction.date}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-3">
            <button
              onClick={() => navigate('/bibliotheque')}
              className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Accéder à ma bibliothèque
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Retour à l'accueil
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              Un problème ? <a href="mailto:support@papers.cm" className="text-indigo-600 hover:underline">Contactez-nous</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;