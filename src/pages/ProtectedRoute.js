import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useUserContext } from './UserContext';

const ProtectedRoute = ({ element, ...rest }) => {
  const { user } = useUserContext();

  return (
    <Route
      {...rest}
      element={user ? element : <Navigate to="/login" replace />}
    />
  );
};

export default ProtectedRoute;