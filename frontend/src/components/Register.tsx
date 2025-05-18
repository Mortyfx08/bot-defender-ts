import React, { useState } from 'react';
import { Page, Layout, Card, DisplayText, Button, TextField, Banner } from '@shopify/polaris';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ email: '', password: '', storeName: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (field: string) => (value: string) => setForm({ ...form, [field]: value });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <DisplayText size="large">Register</DisplayText>
            {error && <Banner status="critical">{error}</Banner>}
            {success && <Banner status="success">{success}</Banner>}
            <form onSubmit={handleSubmit}>
              <TextField label="Store Name" value={form.storeName} onChange={handleChange('storeName')} autoComplete="organization" />
              <TextField label="Email" type="email" value={form.email} onChange={handleChange('email')} autoComplete="email" />
              <TextField label="Password" type="password" value={form.password} onChange={handleChange('password')} autoComplete="current-password" />
              <Button primary submit>Register</Button>
            </form>
            <Button plain onClick={() => navigate('/login')}>Already have an account? Login</Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export default Register;
