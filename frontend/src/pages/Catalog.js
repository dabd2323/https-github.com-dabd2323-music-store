import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API, useAuth } from '@/App';
import ProductCard from '@/components/ProductCard';
import { toast } from 'sonner';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Catalog = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const { user, fetchCartCount } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.type === filterType));
    }
  }, [filterType, products]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erreur lors du chargement des produits');
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
    <div className="min-h-screen pt-24 px-4 pb-12" data-testid="catalog-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4" data-testid="catalog-title">
            Catalogue Musical
          </h1>
          <p className="text-gray-600 mb-6" data-testid="catalog-subtitle">
            Explorez notre collection complète d'albums et de singles
          </p>

          {/* Filters */}
          <div className="flex items-center gap-4 glass p-4 rounded-xl" data-testid="catalog-filters">
            <Filter className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">Filtrer par :</span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]" data-testid="filter-select">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" data-testid="filter-all">Tous</SelectItem>
                <SelectItem value="album" data-testid="filter-album">Albums</SelectItem>
                <SelectItem value="single" data-testid="filter-single">Singles</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500" data-testid="products-count">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulse text-gray-500 text-lg">Chargement des produits...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20" data-testid="no-products">
            <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="products-grid">
            {filteredProducts.map((product, index) => (
              <div key={product.id} style={{ animationDelay: `${index * 0.05}s` }}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalog;