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
      <PermissionRequest />
      <Routes>
        <Route path="/login" element={
          !user ? <Login /> : (user.name ? <Navigate to="/" /> : <Navigate to="/register" />)
        } />

        <Route path="/register" element={
          !user ? <Register /> : <Navigate to="/" />
        } />

        <Route path="/forgot-password" element={
          !user ? <ForgotPassword /> : <Navigate to="/" />
        } />

        <Route path="/" element={
          user ? (user.name ? <Home /> : <Navigate to="/register" />) : <Navigate to="/login" />
        } />

        <Route path="/add-customer" element={
          user ? (user.name ? <AddCustomer /> : <Navigate to="/register" />) : <Navigate to="/login" />
        } />

        <Route path="/my-customers" element={
          user ? (user.name ? <MyCustomers /> : <Navigate to="/register" />) : <Navigate to="/login" />
        } />

        <Route path="/workflow" element={
          user ? (user.name ? <WorkflowManager /> : <Navigate to="/register" />) : <Navigate to="/login" />
        } />

        <Route path="/edit-customer/:id" element={
          user ? (user.name ? <AddCustomer /> : <Navigate to="/register" />) : <Navigate to="/login" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
