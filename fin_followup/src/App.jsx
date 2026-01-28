import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

import Home from './pages/Home';
import AddCustomer from './pages/AddCustomer';
import MyCustomers from './pages/MyCustomers';
import WorkflowManager from './pages/WorkflowManager';
import Register from './pages/Register';
import PermissionRequest from './components/PermissionRequest';

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <BrowserRouter>
      {user && <PermissionRequest />}
      <Routes>
        <Route path="/login" element={
          !user ? <Login /> : <Navigate to="/" />
        } />

        <Route path="/register" element={
          !user ? <Register /> : <Navigate to="/" />
        } />

        <Route path="/forgot-password" element={
          !user ? <ForgotPassword /> : <Navigate to="/" />
        } />

        <Route path="/" element={
          user ? <Home /> : <Navigate to="/login" />
        } />

        <Route path="/add-customer" element={
          user ? <AddCustomer /> : <Navigate to="/login" />
        } />

        <Route path="/my-customers" element={
          user ? <MyCustomers /> : <Navigate to="/login" />
        } />

        <Route path="/workflow" element={
          user ? <WorkflowManager /> : <Navigate to="/login" />
        } />

        <Route path="/edit-customer/:id" element={
          user ? <AddCustomer /> : <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
