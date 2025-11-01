import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Cart = () => {
  const { user, fetchCartCount } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`);
      setCartItems(response.data.items);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      await axios.delete(`${API}/cart/remove/${productId}`);
      setCartItems(cartItems.filter(item => item.product_id !== productId));
      toast.success('Produit retiré du panier');
      fetchCartCount();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.product.prix * item.quantite), 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }

    setCheckoutLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/checkout/create-session`, {
        origin_url: originUrl
      });
      
      // Redirect to Stripe
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erreur lors du paiement');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 text-lg">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 px-4" data-testid="cart-login-required">
        <div className="max-w-2xl mx-auto text-center py-20">
          <ShoppingBag className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Connexion requise
          </h2>
          <p className="text-gray-600 mb-8">
            Veuillez vous connecter pour accéder à votre panier
          </p>
          <Button onClick={() => navigate('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-12" data-testid="cart-page">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8" data-testid="cart-title">
          Mon Panier
        </h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl" data-testid="empty-cart">
            <ShoppingBag className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Votre panier est vide
            </h2>
            <p className="text-gray-600 mb-8">
              Découvrez notre catalogue et ajoutez vos musiques préférées !
            </p>
            <Button onClick={() => navigate('/catalog')} data-testid="go-to-catalog-btn">
              Explorer le catalogue
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4" data-testid="cart-items-list">
              {cartItems.map((item) => (
                <div key={item.product_id} className="glass rounded-2xl p-6 hover-lift animate-fadeIn" data-testid={`cart-item-${item.product_id}`}>
                  <div className="flex gap-6">
                    <img
                      src={item.product.image_url}
                      alt={item.product.titre}
                      className="w-24 h-24 rounded-xl object-cover"
                      data-testid="cart-item-image"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900" data-testid="cart-item-title">
                        {item.product.titre}
                      </h3>
                      <p className="text-gray-600" data-testid="cart-item-artist">
                        {item.product.artiste}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.product.type === 'album' ? 'Album' : 'Single'}
                      </p>
                    </div>
                    <div className="text-right space-y-4">
                      <div className="text-2xl font-bold text-purple-600" data-testid="cart-item-price">
                        {(item.product.prix * item.quantite).toFixed(2)} €
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        data-testid={`remove-item-btn-${item.product_id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass rounded-2xl p-6 sticky top-24" data-testid="order-summary">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Récapitulatif
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span data-testid="items-count">Articles ({cartItems.length})</span>
                    <span data-testid="subtotal">{calculateTotal().toFixed(2)} €</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-purple-600" data-testid="total-price">
                        {calculateTotal().toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  size="lg"
                  className="w-full"
                  disabled={checkoutLoading}
                  data-testid="checkout-btn"
                >
                  {checkoutLoading ? (
                    'Redirection...'
                  ) : (
                    <>
                      Procéder au paiement
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>

                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-gray-600 text-center">
                    Paiement sécurisé par Stripe
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;