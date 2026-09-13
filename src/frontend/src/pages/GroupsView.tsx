import React from 'react';
import { Navigate } from 'react-router-dom';

export const GroupsView: React.FC = () => {
  return <Navigate to="/devices" replace />;
};
