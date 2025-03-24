import React, { useEffect, useState } from "react";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion, 
  increment, 
  addDoc,
  getDoc 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Timestamp } from "firebase/firestore"; 
import { useNavigate } from "react-router-dom";
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ArrowRightIcon, 
  BookOpenIcon,
  HomeIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

const SuccessPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [purchaseDetails, setPurchaseDetails] = useState(null);
  const navigate = useNavigate();

  const processPurchaseAndUpdateDB = async (bookData) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non connecté");

      // 1. Update user's purchased books
      await updateDoc(doc(db, 'users', user.uid), {
        buyed: arrayUnion(bookData.id)
      });

      // 2. Create sale record
      const venteRef = await addDoc(collection(db, "ventes_direct"), {
        user: user.uid,
        auteur: bookData.authorId,
        livre: bookData.id,
        prix: bookData.price,
        date: Timestamp.now(),
        etat: "reussi",
        moyen: "stripe",
        titre: bookData.title
      });

      // 3. Update author balance and transactions
      const authorRef = doc(db, 'auteurs', bookData.authorId);
      await Promise.all([
        updateDoc(authorRef, {
          solde: increment(bookData.price)
        }),
        addDoc(collection(authorRef, 'transactions'), {
          livre: bookData.id,
          titre: bookData.title,
          montant: bookData.price,
          date: Timestamp.now(),
          utilisateur: user.uid
        })
      ]);

      return { 
        success: true, 
        venteId: venteRef.id,
        bookTitle: bookData.title,
        price: bookData.price
      };
    } catch (error) {
      console.error("Erreur lors du traitement:", error);
      throw error;
    }
  };

  const handleSuccessfulPurchase = async () => {
    try {
      const ventesRef = collection(db, "ventes_direct");
      const q = query(ventesRef, where("etat", "==", "en cours"));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const processedPurchases = [];
        
        for (const venteDoc of querySnapshot.docs) {
          const venteData = venteDoc.data();
          
          // Get complete book details
          const bookDoc = await getDoc(doc(db, 'livres', venteData.livre));
          if (!bookDoc.exists()) throw new Error("Livre non trouvé");
          
          const bookData = { 
            id: bookDoc.id, 
            title: bookDoc.data().name,
            ...bookDoc.data() 
          };
          
          const result = await processPurchaseAndUpdateDB({
            ...bookData,
            authorId: venteData.auteur,
            price: venteData.prix
          });

          await updateDoc(venteDoc.ref, { etat: "reussi" });
          processedPurchases.push(result);
        }

        setPurchaseDetails({
          count: processedPurchases.length,
          lastPurchase: processedPurchases[0]
        });
        setPurchaseStatus("success");
      } else {
        setPurchaseStatus("no_pending");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setPurchaseStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSuccessfulPurchase();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8">
          <div className="relative">
            <ArrowPathIcon className="h-12 w-12 text-indigo-600 animate-spin" />
          </div>
          <h3 className="text-lg font-medium text-gray-700">Validation de votre achat</h3>
          <p className="text-gray-500 text-center max-w-md">
            Nous finalisons votre transaction et préparons votre contenu...
          </p>
        </div>
      );
    }

    switch (purchaseStatus) {
      case "success":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Paiement confirmé !</h2>
              
              {purchaseDetails && (
                <div className="mt-4 space-y-2">
                  <p className="text-gray-600">
                    Vous avez acheté <span className="font-semibold">{purchaseDetails.lastPurchase.bookTitle}</span>
                  </p>
                  <p className="text-lg font-medium text-gray-900">
                    {purchaseDetails.lastPurchase.price} €
                  </p>
                </div>
              )}
              
              <div className="mt-6 bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">
                  Votre livre est maintenant disponible dans votre bibliothèque.
                </p>
              </div>
            </div>
            
            <div className="mt-8 space-y-4">
              <button
                onClick={() => navigate("/bibliotheque")}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Accéder à ma bibliothèque
              </button>
              
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <HomeIcon className="h-5 w-5 mr-2" />
                Retour à l'accueil
              </button>
            </div>
          </div>
        );
      case "no_pending":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100">
                <ExclamationCircleIcon className="h-10 w-10 text-yellow-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Aucun achat en attente</h2>
              <p className="mt-2 text-gray-600">
                Votre paiement a été accepté mais aucun achat n'était en attente de validation.
              </p>
            </div>
            
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-700">
                Si vous pensez qu'il s'agit d'une erreur, contactez notre support avec votre référence de paiement.
              </p>
            </div>
            
            <button
              onClick={() => navigate("/contact")}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Contacter le support
            </button>
          </div>
        );
      case "error":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                <ExclamationCircleIcon className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900">Erreur de traitement</h2>
              <p className="mt-2 text-gray-600">
                Votre paiement a été accepté mais une erreur est survenue lors de l'enregistrement.
              </p>
            </div>
            
            <div className="mt-6 bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-700">
                Ne vous inquiétez pas, votre paiement est sécurisé. Veuillez contacter notre support avec votre référence de paiement pour résoudre ce problème.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate("/contact")}
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Support technique
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Réessayer
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Confirmation de paiement
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Merci pour votre achat sur notre plateforme
          </p>
        </div>
        
        <div className="mt-8">
          {renderContent()}
        </div>
        
        <div className="pt-5 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Besoin d'aide ? Contactez-nous à <span className="text-indigo-600">support@votreapp.com</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;