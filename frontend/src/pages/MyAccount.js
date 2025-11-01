import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { User, Package, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export const MyAccount = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen pt-24 px-4 pb-12" data-testid="account-page">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8" data-testid="account-title">
          Mon Compte
        </h1>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="w-4 h-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="w-4 h-4 mr-2" />
              Mes Commandes
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="glass rounded-2xl p-8 space-y-6 animate-fadeIn" data-testid="profile-section">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900" data-testid="user-name">
                    {user.prenom} {user.nom}
                  </h2>
                  <p className="text-gray-600" data-testid="user-email">{user.email}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Prénom
                  </label>
                  <div className="glass px-4 py-3 rounded-xl" data-testid="profile-prenom">
                    {user.prenom}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Nom
                  </label>
                  <div className="glass px-4 py-3 rounded-xl" data-testid="profile-nom">
                    {user.nom}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Email
                  </label>
                  <div className="glass px-4 py-3 rounded-xl" data-testid="profile-email">
                    {user.email}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Adresse
                  </label>
                  <div className="glass px-4 py-3 rounded-xl" data-testid="profile-adresse">
                    {user.adresse}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  data-testid="logout-btn"
                >
                  Déconnexion
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="space-y-6 animate-fadeIn">
              {loading ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <div className="animate-pulse text-gray-500">Chargement...</div>
                </div>
              ) : orders.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center" data-testid="no-orders">
                  <Package className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Aucune commande
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Vous n'avez pas encore effectué d'achat
                  </p>
                  <Button onClick={() => navigate('/catalog')}>
                    Explorer le catalogue
                  </Button>
                </div>
              ) : (
                <div className="space-y-4" data-testid="orders-list">
                  {orders.map((order) => (
                    <div key={order.id} className="glass rounded-2xl p-6" data-testid={`order-${order.id}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900" data-testid="order-number">
                            Commande #{order.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <Badge
                          className={order.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}
                          data-testid="order-status"
                        >
                          {order.payment_status === 'paid' ? 'Payé' : 'En attente'}
                        </Badge>
                      </div>

                      <div className="space-y-3 mb-4">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b last:border-0" data-testid={`order-item-${index}`}>
                            <div>
                              <p className="font-medium text-gray-900" data-testid={`order-item-title-${index}`}>
                                {item.titre}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantité : {item.quantite}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-purple-600">
                                {(item.prix * item.quantite).toFixed(2)} €
                              </p>
                              {order.payment_status === 'paid' && (
                                <a
                                  href={item.download_url}
                                  download
                                  className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 mt-1"
                                  data-testid={`download-link-${index}`}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Télécharger
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-purple-600" data-testid="order-total">
                          {order.total.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyAccount;