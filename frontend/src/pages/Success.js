import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { CheckCircle, Download, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Success = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { user, fetchCartCount } = useAuth();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [order, setOrder] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (sessionId) {
      pollPaymentStatus();
    } else {
      navigate('/cart');
    }
  }, [sessionId, user]);

  const pollPaymentStatus = async () => {
    if (attempts >= maxAttempts) {
      setStatus('error');
      return;
    }

    try {
      const response = await axios.get(`${API}/checkout/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        // Fetch order details
        const orderResponse = await axios.get(`${API}/orders/${response.data.order_id}`);
        setOrder(orderResponse.data);
        fetchCartCount();
      } else if (response.data.status === 'expired') {
        setStatus('error');
      } else {
        // Continue polling
        setAttempts(prev => prev + 1);
        setTimeout(pollPaymentStatus, 2000);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, 2000);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-12" data-testid="success-page">
      <div className="max-w-3xl mx-auto">
        {status === 'checking' && (
          <div className="glass rounded-3xl p-12 text-center animate-fadeIn" data-testid="checking-status">
            <Loader className="w-20 h-20 text-purple-600 mx-auto mb-6 animate-spin" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Vérification du paiement...
            </h2>
            <p className="text-gray-600">
              Veuillez patienter pendant que nous confirmons votre paiement.
            </p>
            <div className="flex justify-center items-center space-x-2 mt-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="wave-bar bg-gradient-to-t from-purple-600 to-pink-600 w-2 rounded-full"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {status === 'success' && order && (
          <div className="space-y-6 animate-fadeIn" data-testid="payment-success">
            <div className="glass rounded-3xl p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="success-title">
                Paiement réussi !
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Merci pour votre achat. Votre commande a été confirmée.
              </p>
              <div className="inline-block glass px-6 py-3 rounded-xl">
                <p className="text-sm text-gray-600">Numéro de commande</p>
                <p className="text-lg font-bold text-purple-600" data-testid="order-id">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Order Details */}
            <div className="glass rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Détails de la commande
              </h2>
              <div className="space-y-4" data-testid="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-4 border-b last:border-0" data-testid={`order-item-${index}`}>
                    <div>
                      <h3 className="font-semibold text-gray-900" data-testid={`item-title-${index}`}>
                        {item.titre}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Quantité : {item.quantite}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600" data-testid={`item-price-${index}`}>
                        {(item.prix * item.quantite).toFixed(2)} €
                      </p>
                      <a
                        href={item.download_url}
                        download
                        className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 mt-2"
                        data-testid={`download-btn-${index}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Télécharger
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t flex justify-between items-center">
                <span className="text-xl font-bold">Total</span>
                <span className="text-2xl font-bold text-purple-600" data-testid="order-total">
                  {order.total.toFixed(2)} €
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate('/account')}
                variant="outline"
                size="lg"
                className="flex-1"
                data-testid="view-orders-btn"
              >
                Voir mes commandes
              </Button>
              <Button
                onClick={() => navigate('/catalog')}
                size="lg"
                className="flex-1"
                data-testid="continue-shopping-btn"
              >
                Continuer mes achats
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="glass rounded-3xl p-12 text-center animate-fadeIn" data-testid="payment-error">
            <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl text-white">×</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Erreur de paiement
            </h2>
            <p className="text-gray-600 mb-8">
              Une erreur s'est produite lors de la vérification de votre paiement.
              <br />
              Veuillez vérifier votre email ou contacter le support.
            </p>
            <Button onClick={() => navigate('/cart')} data-testid="back-to-cart-btn">
              Retour au panier
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Success;