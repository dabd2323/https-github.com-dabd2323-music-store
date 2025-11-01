import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API } from '@/App';
import { Music, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import { toast } from 'sonner';
import { useAuth } from '@/App';

export const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, fetchCartCount } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setFeaturedProducts(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      toast.error('Veuillez vous connecter pour ajouter au panier');
      return;
    }

    try {
      await axios.post(`${API}/cart/add`, {
        product_id: product.id,
        quantite: 1
      });
      toast.success('Produit ajouté au panier !');
      fetchCartCount();
    } catch (error) {
      toast.error("Erreur lors de l'ajout au panier");
    }
  };

  return (
    <div className="min-h-screen pt-16" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-200/40 via-pink-200/40 to-blue-200/40" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center space-y-8 animate-fadeIn">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <Music className="w-24 h-24 text-purple-600 animate-pulse" />
                <Sparkles className="w-8 h-8 text-pink-500 absolute -top-2 -right-2" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900" data-testid="hero-title">
              Découvrez la musique
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                qui vous inspire
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto" data-testid="hero-subtitle">
              Albums et singles exclusifs de nos artistes indépendants.
              <br />
              Écoutez des extraits et téléchargez vos morceaux préférés.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/catalog">
                <Button size="lg" className="text-lg px-8 py-6" data-testid="cta-explore-btn">
                  <Music className="w-5 h-5 mr-2" />
                  Explorer le catalogue
                </Button>
              </Link>
            </div>

            {/* Music wave animation */}
            <div className="flex justify-center items-end space-x-2 h-12 pt-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="wave-bar bg-gradient-to-t from-purple-600 to-pink-600 w-2 rounded-full"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-2" />
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" data-testid="featured-title">
                À la une
              </h2>
            </div>
            <p className="text-gray-600" data-testid="featured-subtitle">
              Découvrez notre sélection du moment
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-pulse text-gray-500">Chargement...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="featured-products-grid">
              {featuredProducts.map((product, index) => (
                <div key={product.id} style={{ animationDelay: `${index * 0.1}s` }}>
                  <ProductCard product={product} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/catalog">
              <Button variant="outline" size="lg" data-testid="view-all-btn">
                Voir tout le catalogue
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-white/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 glass rounded-2xl animate-slideIn" data-testid="feature-quality">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Haute qualité</h3>
              <p className="text-gray-600">Fichiers audio en qualité studio</p>
            </div>

            <div className="text-center p-8 glass rounded-2xl animate-slideIn" style={{ animationDelay: '0.1s' }} data-testid="feature-instant">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Téléchargement instantané</h3>
              <p className="text-gray-600">Accès immédiat après paiement</p>
            </div>

            <div className="text-center p-8 glass rounded-2xl animate-slideIn" style={{ animationDelay: '0.2s' }} data-testid="feature-support">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Soutenez les artistes</h3>
              <p className="text-gray-600">Achat direct aux créateurs</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;