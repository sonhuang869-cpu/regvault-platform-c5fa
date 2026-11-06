import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import RiskDashboard from './pages/RiskDashboard';
import ObligationRegistry from './pages/ObligationRegistry';
import ControlWorkbench from './pages/ControlWorkbench';
import ReportFiling from './pages/ReportFiling';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E2535',
            border: '1px solid #2A3347',
            color: '#E8ECF4',
          },
        }}
      />
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <RiskDashboard />
            </Layout>
          }
        />
        <Route
          path="/obligations"
          element={
            <Layout>
              <ObligationRegistry />
            </Layout>
          }
        />
        <Route
          path="/controls"
          element={
            <Layout>
              <ControlWorkbench />
            </Layout>
          }
        />
        <Route
          path="/filings"
          element={
            <Layout>
              <ReportFiling />
            </Layout>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
