import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { DevicesView } from './pages/DevicesView';
import { RestaurantsView } from './pages/RestaurantsView';
import { MediaAssetsView } from './pages/MediaAssetsView';
import { ContentDistributionView } from './pages/ContentDistributionView';
import { PlaylistsView } from './pages/PlaylistsView';
import { GuestScreenConfigView } from './pages/GuestScreenConfigView';
import { ReportsView } from './pages/ReportsView';
import { AuditLogs } from './pages/AuditLogs';
import { UsersView } from './pages/UsersView';
import { SettingsPage } from './pages/Settings';
import { getAuthToken, getCurrentUserFromStorage } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getAuthToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RequireAdminOrSupervisor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = getCurrentUserFromStorage();
  const role = (user?.role || '').toUpperCase();
  const isAllowed = role === 'ADMINISTRATOR' || role === 'ADMIN' || role === 'SUPERVISOR';
  if (!isAllowed) {
    return <Navigate to="/devices" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            {/* Primary Centerpiece: Devices / Кассы & Рестораны */}
            <Route index element={<DevicesView />} />
            <Route path="devices" element={<DevicesView />} />
            <Route path="restaurants" element={<RestaurantsView />} />
            <Route path="groups" element={<RestaurantsView />} />
            
            {/* Content & Playlists */}
            <Route path="media" element={<MediaAssetsView />} />
            <Route path="content" element={<ContentDistributionView />} />
            <Route path="playlists" element={<PlaylistsView />} />
            <Route path="guestscreen" element={<GuestScreenConfigView />} />
            
            {/* System, Reports & Audit */}
            <Route path="reports" element={<ReportsView />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route
              path="users"
              element={
                <RequireAdminOrSupervisor>
                  <UsersView />
                </RequireAdminOrSupervisor>
              }
            />
            <Route
              path="settings"
              element={
                <RequireAdminOrSupervisor>
                  <SettingsPage />
                </RequireAdminOrSupervisor>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
