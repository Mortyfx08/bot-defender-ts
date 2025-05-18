import React, { useState } from 'react';
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  Banner,
  DisplayText
} from '@shopify/polaris';
import { LockMajor } from '@shopify/polaris-icons';
import '@shopify/polaris/build/esm/styles.css';

interface LoginProps {
  onLogin?: (user: any) => void;
}

function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) throw new Error('Login failed');
      
      const { token, user } = await response.json();
      localStorage.setItem('token', token);
      if (onLogin) onLogin(user);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <DisplayText size="large">Login</DisplayText>
            {error && (
              <Banner status="critical">
                <p>{error}</p>
              </Banner>
            )}
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete="current-password"
              />
              <Button submit primary icon={LockMajor}>
                Sign In
              </Button>
            </form>
            <Button plain onClick={() => window.location.href = '/register'}>
              Don&apos;t have an account? Register
            </Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Login;