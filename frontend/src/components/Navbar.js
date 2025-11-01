import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { ShoppingCart, User, LogOut, Menu, X, Music, Shield } from 'lucide-react';
import AuthModal from './AuthModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Navbar = () => {
  const { user, logout, cartCount } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="glass fixed w-full top-0 z-50" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2" data-testid="nav-logo">
              <Music className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                MusicStore
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-purple-600 font-medium transition-colors" data-testid="nav-home">
                Accueil
              </Link>
              <Link to="/catalog" className="text-gray-700 hover:text-purple-600 font-medium transition-colors" data-testid="nav-catalog">
                Catalogue
              </Link>
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Cart */}
              <Link to="/cart" className="relative" data-testid="nav-cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center" data-testid="cart-count">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="user-menu-trigger">
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')} data-testid="nav-admin">
                        <Shield className="w-4 h-4 mr-2" />
                        Administration
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/account')} data-testid="nav-account">
                      <User className="w-4 h-4 mr-2" />
                      Mon Compte
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} data-testid="nav-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={() => setShowAuthModal(true)} data-testid="nav-login-btn">
                  Connexion
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200" data-testid="mobile-menu">
            <div className="px-4 py-4 space-y-3">
              <Link to="/" className="block text-gray-700 hover:text-purple-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Accueil
              </Link>
              <Link to="/catalog" className="block text-gray-700 hover:text-purple-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Catalogue
              </Link>
              <Link to="/cart" className="block text-gray-700 hover:text-purple-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                Panier ({cartCount})
              </Link>
              {user ? (
                <>
                  <Link to="/account" className="block text-gray-700 hover:text-purple-600 font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Mon Compte
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left text-gray-700 hover:text-purple-600 font-medium">
                    Déconnexion
                  </button>
                </>
              ) : (
                <button onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }} className="block w-full text-left text-purple-600 font-medium">
                  Connexion
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default Navbar;