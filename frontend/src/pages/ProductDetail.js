import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Play, Pause, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, fetchCartCount } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());

  useEffect(() => {
    fetchProduct();
    return () => {
      audio.pause();
    };
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API}/products/${id}`);
      setProduct(response.data);
      audio.src = response.data.audio_preview_url;
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Produit non trouvé');
      navigate('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleAddToCart = async () => {
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

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 text-lg">Chargement...</div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen pt-24 px-4 pb-12" data-testid="product-detail-page">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="grid md:grid-cols-2 gap-12 animate-fadeIn">
          {/* Image & Player */}
          <div className="space-y-6">
            <div className="glass rounded-3xl overflow-hidden">
              <div className="relative aspect-square">
                <img
                  src={product.image_url}
                  alt={product.titre}
                  className="w-full h-full object-cover"
                  data-testid="product-detail-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            </div>

            {/* Audio Player */}
            <div className="glass rounded-2xl p-6" data-testid="audio-player">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">Extrait audio</span>
                <Badge>{product.type === 'album' ? 'Album' : 'Single'}</Badge>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={togglePlay}
                  className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                  data-testid="play-pause-btn"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 text-white" />
                  ) : (
                    <Play className="w-7 h-7 text-white ml-1" />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{product.titre}</div>
                  <div className="text-sm text-gray-600">{product.artiste}</div>
                </div>

                {/* Wave visualization */}
                {isPlaying && (
                  <div className="flex items-end space-x-1 h-12">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="wave-bar bg-gradient-to-t from-purple-600 to-pink-600 w-1.5 rounded-full"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid="product-detail-title">
                {product.titre}
              </h1>
              <p className="text-xl text-gray-600" data-testid="product-detail-artist">
                par {product.artiste}
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent" data-testid="product-detail-price">
                  {product.prix.toFixed(2)} €
                </span>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-gray-700 leading-relaxed" data-testid="product-detail-description">
                {product.description}
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="w-full text-lg py-6"
                data-testid="add-to-cart-detail-btn"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ajouter au panier
              </Button>

              <div className="glass rounded-xl p-4">
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3" />
                    Téléchargement instantané après paiement
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3" />
                    Fichiers haute qualité
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-3" />
                    Paiement sécurisé
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;