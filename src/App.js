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
import CollectionDetail from './pages/collectiondetails.jsx';
import SuccessPage from './pages/successpage.jsx';


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
            <Route path="/collection/:collectionId" element={<CollectionDetail />} />
            <Route path="/success/:bookId/:userId" element={<SuccessPage />} />
            
            <Route path="*" element={<NotFound />} /> {/* Route 404 */}
           
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;