import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  AppProvider,
  Frame,
  TopBar,
  Navigation,
  Page,
  Loading
} from '@shopify/polaris';
import {
  HomeMajor,
  SettingsMajor,
  LogOutMinor
} from '@shopify/polaris-icons';
import '@shopify/polaris/build/esm/styles.css';

// Import your components
import Welcome from './components/Welcome';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import BotSettings from './pages/BotSettings';

// Define User type
interface User {
  name?: string;
  email?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  useEffect(() => {
    // Simulate auth check
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(userData => setUser(userData))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) return <Loading />;
    return user ? children : <Navigate to="/login" />;
  };

  // Top bar markup
  const topBarMarkup = user ? (
    <TopBar
      showNavigationToggle
      userMenu={
        <TopBar.UserMenu
          name={user?.name || 'User'}
          detail={user?.email || ''}
          initials={user?.name?.charAt(0) || 'U'}
          open={false} // TODO: wire up open state if needed
          onToggle={() => {}} // TODO: wire up toggle handler if needed
          actions={[
            {
              items: [{ content: 'Logout', icon: LogOutMinor, onAction: handleLogout }]
            }
          ]}
        />
      }
      onNavigationToggle={() => setMobileNavigationActive(!mobileNavigationActive)}
    />
  ) : null;

  // Navigation markup
  const navigationMarkup = user ? (
    <Navigation location="/" 
      onDismiss={() => setMobileNavigationActive(false)}
      ariaLabelledBy="navigation-label"
    >
      <Navigation.Section
        items={[
          {
            url: '/dashboard',
            label: 'Dashboard',
            icon: HomeMajor,
            matches: window.location.pathname === '/dashboard'
          },
          {
            url: '/settings',
            label: 'Bot Settings',
            icon: SettingsMajor,
            matches: window.location.pathname === '/settings'
          },
        ]}
      />
    </Navigation>
  ) : null;

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loading />
      </div>
    );
  }

  return (
    <AppProvider i18n={{
      Polaris: {
        Avatar: { label: 'Avatar', labelWithInitials: 'Avatar with initials {initials}' },
        Frame: { skipToContent: 'Skip to content' },
        // ...add more keys as needed for your app
      }
    }}>
      <Router>
        <Frame
          topBar={topBarMarkup}
          navigation={navigationMarkup}
          showMobileNavigation={mobileNavigationActive}
          onNavigationDismiss={() => setMobileNavigationActive(false)}
        >
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login onLogin={setUser} />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <BotSettings />
                </ProtectedRoute>
              }
            />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
          </Routes>
        </Frame>
      </Router>
    </AppProvider>
  );
}

export default App;