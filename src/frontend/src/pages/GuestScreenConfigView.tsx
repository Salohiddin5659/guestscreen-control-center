import React from 'react';
import { Navigate } from 'react-router-dom';

export const GuestScreenConfigView: React.FC = () => {
  return <Navigate to="/content" replace />;
};
