import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import '@/App.css';
import Home from '@/pages/Home';
import Catalog from '@/pages/Catalog';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Success from '@/pages/Success';
import MyAccount from '@/pages/MyAccount';
import AdminDashboard from '@/pages/AdminDashboard';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      fetchCartCount();
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await axios.get(`${API}/cart`);
      const count = response.data.items.reduce((sum, item) => sum + item.quantite, 0);
      setCartCount(count);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const login = async (email, mot_de_passe) => {
    const response = await axios.post(`${API}/auth/login`, { email, mot_de_passe });
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
    fetchCartCount();
    return response.data;
  };

  const register = async (userData) => {
    const response = await axios.post(`${API}/auth/register`, userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setCartCount(0);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, cartCount, setCartCount, fetchCartCount }}>
      {children}
    </AuthContext.Provider>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/success" element={<Success />} />
            <Route path="/account" element={<MyAccount />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;