import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "@firebase/auth";
import { getFirestore } from "@firebase/firestore";

const configurationFirebase = {
  apiKey: "AIzaSyDlrQAdJLoJTeG3S5LakaHFwWrCCcz7cEA",
  authDomain: "papersbook-f3826.firebaseapp.com",
  projectId: "papersbook-f3826",
  storageBucket: "papersbook-f3826.appspot.com",
  messagingSenderId: "232506897629",
  appId: "1:232506897629:web:ff1d449742444c7d4d9734",
  measurementId: "G-JL47RHZXV5"
};

const app = initializeApp(configurationFirebase); 
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);