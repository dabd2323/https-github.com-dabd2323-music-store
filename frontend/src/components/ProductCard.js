import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const ProductCard = ({ product, onAddToCart, showAddButton = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(product.audio_preview_url));

  const togglePlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart(product);
  };

  return (
    <Link to={`/product/${product.id}`} data-testid={`product-card-${product.id}`}>
      <div className="glass rounded-2xl overflow-hidden hover-lift animate-fadeIn group">
        {/* Image */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.titre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            data-testid="product-image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Play button */}
          <button
            onClick={togglePlay}
            className="absolute top-4 right-4 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all hover:scale-110"
            data-testid="play-preview-btn"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-purple-600" />
            ) : (
              <Play className="w-5 h-5 text-purple-600 ml-1" />
            )}
          </button>

          {/* Type badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-purple-600 text-white" data-testid="product-type">
              {product.type === 'album' ? 'Album' : 'Single'}
            </Badge>
          </div>

          {/* Price */}
          <div className="absolute bottom-4 left-4">
            <div className="text-white text-2xl font-bold" data-testid="product-price">
              {product.prix.toFixed(2)} €
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <h3 className="text-xl font-bold text-gray-800" data-testid="product-title">
            {product.titre}
          </h3>
          <p className="text-gray-600" data-testid="product-artist">
            {product.artiste}
          </p>
          <p className="text-sm text-gray-500 line-clamp-2" data-testid="product-description">
            {product.description}
          </p>

          {showAddButton && (
            <Button
              onClick={handleAddToCart}
              className="w-full mt-4"
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ajouter au panier
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;