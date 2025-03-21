import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/login.jsx';
import Home from './pages/homes.jsx';
import DiscoverScreen from './pages/discover.jsx';
import CategoryDetails from './pages/CategoryDetail.jsx';
import BookDetails from './pages/bookdetails.jsx';
import Bibliothèque from './pages/biblio.jsx';
import NotFound from './pages/NotFound.jsx'; // Assurez-vous d'avoir ce composant
import 'bootstrap/dist/css/bootstrap.min.css';
import Profile from './pages/Profile.jsx';
// import PdfViewer from './pages/PdfViewer.jsx';
import SuccessPage from './pages/successpage.jsx';
// import PrePurchasePage from './pages/pre-purchase.jsx';


function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<Navigate to="/homes" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/homes" element={<Home />} />
            <Route path="/discover" element={<DiscoverScreen />} />
            <Route path="/CategoryDetail" element={<CategoryDetails />} />
            <Route path="/book/:bookId" element={<BookDetails />} />
            <Route path="/biblio" element={<Bibliothèque />} />
            <Route path="/Profile" element={<Profile/>} />
            {/* <Route path="/PdfViewer" element={<PdfViewer/>} /> */}
            <Route path="/success/:bookId" element={<SuccessPage />} />
            {/* <Route path="/pre-purchase" element={<PrePurchasePage/>} /> */}

            <Route path="*" element={<NotFound />} /> {/* Route 404 */}
           
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;