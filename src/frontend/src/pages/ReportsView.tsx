import React from 'react';
import { Navigate } from 'react-router-dom';

export const ReportsView: React.FC = () => {
  return <Navigate to="/audit" replace />;
};
