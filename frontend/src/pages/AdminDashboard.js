import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API, useAuth } from '@/App';
import { Users, Package, ShoppingBag, TrendingUp, Mail, Settings, Plus, Edit, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [editProductModal, setEditProductModal] = useState(false);
  const [addProductModal, setAddProductModal] = useState(false);
  const [newsletterModal, setNewsletterModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Forms
  const [productForm, setProductForm] = useState({
    titre: '',
    artiste: '',
    type: 'single',
    prix: '',
    image_url: '',
    audio_preview_url: '',
    audio_file_url: '',
    description: ''
  });
  
  // File states
  const [imageFile, setImageFile] = useState(null);
  const [audioPreviewFile, setAudioPreviewFile] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [audioFiles, setAudioFiles] = useState([]); // For albums (multiple files)
  const [trackTitles, setTrackTitles] = useState([]); // Titles for each track
  const [uploading, setUploading] = useState(false);
  
  const [newsletterForm, setNewsletterForm] = useState({
    subject: '',
    message: '',
    send_to: 'all'
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    // Check if user is admin (we'll verify on backend too)
    fetchAdminData();
  }, [user]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/products`),
        axios.get(`${API}/admin/orders`)
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Accès réservé aux administrateurs');
        navigate('/');
      } else {
        toast.error('Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let image_url = productForm.image_url;
      let audio_preview_url = productForm.audio_preview_url;
      let audio_file_url = productForm.audio_file_url;
      let tracks = [];
      
      // Upload image if file selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await axios.post(`${API}/upload/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        image_url = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      }
      
      // Upload audio preview if file selected
      if (audioPreviewFile) {
        const formData = new FormData();
        formData.append('file', audioPreviewFile);
        const response = await axios.post(`${API}/upload/audio-preview`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        audio_preview_url = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      }
      
      // If it's an album with multiple files
      if (productForm.type === 'album' && audioFiles.length > 0) {
        const formData = new FormData();
        audioFiles.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await axios.post(`${API}/upload/multiple-audio-files`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        // Create tracks array
        tracks = response.data.files.map((file, index) => ({
          numero: index + 1,
          titre: trackTitles[index] || file.original_name.replace(/\.[^/.]+$/, ""),
          audio_url: `${process.env.REACT_APP_BACKEND_URL}${file.url}`
        }));
        
        // Use first track as audio_file_url for compatibility
        audio_file_url = tracks[0].audio_url;
      } 
      // If it's a single with one file
      else if (audioFile) {
        const formData = new FormData();
        formData.append('file', audioFile);
        const response = await axios.post(`${API}/upload/audio-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        audio_file_url = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      }
      
      // Create product with uploaded URLs
      await axios.post(`${API}/products`, {
        ...productForm,
        prix: parseFloat(productForm.prix),
        image_url,
        audio_preview_url,
        audio_file_url,
        tracks: productForm.type === 'album' ? tracks : []
      });
      
      toast.success('Produit ajouté avec succès');
      setAddProductModal(false);
      setProductForm({
        titre: '',
        artiste: '',
        type: 'single',
        prix: '',
        image_url: '',
        audio_preview_url: '',
        audio_file_url: '',
        description: ''
      });
      setImageFile(null);
      setAudioPreviewFile(null);
      setAudioFile(null);
      setAudioFiles([]);
      setTrackTitles([]);
      fetchAdminData();
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du produit');
    } finally {
      setUploading(false);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let updates = { ...productForm };
      if (productForm.prix) updates.prix = parseFloat(productForm.prix);
      
      // Upload new image if file selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const response = await axios.post(`${API}/upload/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updates.image_url = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      }
      
      // Upload new audio preview if file selected
      if (audioPreviewFile) {
        const formData = new FormData();
        formData.append('file', audioPreviewFile);
        const response = await axios.post(`${API}/upload/audio-preview`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updates.audio_preview_url = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      }
      
      // Upload new audio file if file selected
      if (audioFile) {
        const formData = new FormData();
        formData.append('file', audioFile);
        const response = await axios.post(`${API}/upload/audio-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        updates.audio_file_url = `${process.env.REACT_APP_BACKEND_URL}${response.data.url}`;
      }
      
      await axios.put(`${API}/admin/products/${selectedProduct.id}`, updates);
      toast.success('Produit mis à jour avec succès');
      setEditProductModal(false);
      setSelectedProduct(null);
      setImageFile(null);
      setAudioPreviewFile(null);
      setAudioFile(null);
      fetchAdminData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
      await axios.delete(`${API}/admin/products/${productId}`);
      toast.success('Produit supprimé avec succès');
      fetchAdminData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await axios.patch(`${API}/admin/users/${userId}/role?role=${newRole}`);
      toast.success('Rôle mis à jour avec succès');
      fetchAdminData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
      await axios.delete(`${API}/admin/users/${userId}`);
      toast.success('Utilisateur supprimé avec succès');
      fetchAdminData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const handleSendNewsletter = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API}/admin/send-newsletter`, newsletterForm);
      toast.success(`Newsletter envoyée à ${response.data.sent} utilisateurs`);
      setNewsletterModal(false);
      setNewsletterForm({ subject: '', message: '', send_to: 'all' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi');
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setProductForm({
      titre: product.titre,
      artiste: product.artiste,
      type: product.type,
      prix: product.prix.toString(),
      image_url: product.image_url,
      audio_preview_url: product.audio_preview_url,
      audio_file_url: product.audio_file_url,
      description: product.description
    });
    setEditProductModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-12 bg-gradient-to-br from-purple-50 to-pink-50" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3" data-testid="admin-title">
              <Shield className="w-10 h-10 text-purple-600" />
              Administration
            </h1>
            <p className="text-gray-600 mt-2">Gérez votre boutique musicale</p>
          </div>
          <Button onClick={() => setNewsletterModal(true)} data-testid="send-newsletter-btn">
            <Mail className="w-4 h-4 mr-2" />
            Envoyer une Newsletter
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass rounded-2xl p-6 hover-lift" data-testid="stat-users">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.total_users}</span>
              </div>
              <p className="text-gray-600 font-medium">Utilisateurs</p>
            </div>

            <div className="glass rounded-2xl p-6 hover-lift" data-testid="stat-products">
              <div className="flex items-center justify-between mb-4">
                <Package className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.total_products}</span>
              </div>
              <p className="text-gray-600 font-medium">Produits</p>
            </div>

            <div className="glass rounded-2xl p-6 hover-lift" data-testid="stat-orders">
              <div className="flex items-center justify-between mb-4">
                <ShoppingBag className="w-8 h-8 text-green-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.paid_orders}</span>
              </div>
              <p className="text-gray-600 font-medium">Commandes</p>
            </div>

            <div className="glass rounded-2xl p-6 hover-lift" data-testid="stat-revenue">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-pink-600" />
                <span className="text-3xl font-bold text-gray-900">{stats.total_revenue} €</span>
              </div>
              <p className="text-gray-600 font-medium">Revenus</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="glass">
            <TabsTrigger value="products" data-testid="tab-products">
              <Package className="w-4 h-4 mr-2" />
              Produits
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Commandes
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="glass rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Gestion des Produits</h2>
                <Button onClick={() => setAddProductModal(true)} data-testid="add-product-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un Produit
                </Button>
              </div>
              
              <div className="space-y-4" data-testid="products-list">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-shadow" data-testid={`product-item-${product.id}`}>
                    <img src={product.image_url} alt={product.titre} className="w-20 h-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{product.titre}</h3>
                      <p className="text-gray-600">{product.artiste}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge>{product.type}</Badge>
                        <span className="text-purple-600 font-bold">{product.prix} €</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(product)} data-testid={`edit-product-${product.id}`}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:bg-red-50" data-testid={`delete-product-${product.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6">Gestion des Utilisateurs</h2>
              
              <div className="space-y-4" data-testid="users-list">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 p-4 bg-white rounded-xl" data-testid={`user-item-${u.id}`}>
                    <div className="flex-1">
                      <h3 className="font-bold">{u.prenom} {u.nom}</h3>
                      <p className="text-gray-600 text-sm">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={u.role === 'admin' ? 'bg-purple-600' : 'bg-gray-500'}>
                          {u.role}
                        </Badge>
                        {u.email_verifie && <Badge className="bg-green-500">Vérifié</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Select value={u.role} onValueChange={(role) => handleUpdateUserRole(u.id, role)} disabled={u.id === user.id}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {u.id !== user.id && (
                        <Button variant="outline" size="sm" onClick={() => handleDeleteUser(u.id)} className="text-red-600" data-testid={`delete-user-${u.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-6">Toutes les Commandes</h2>
              
              <div className="space-y-4" data-testid="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 bg-white rounded-xl" data-testid={`order-item-${order.id}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold">#{order.id.slice(0, 8).toUpperCase()}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge className={order.payment_status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {order.payment_status === 'paid' ? 'Payé' : 'En attente'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {order.items.length} article(s)
                    </div>
                    <div className="text-lg font-bold text-purple-600 mt-2">
                      {order.total.toFixed(2)} €
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Modal */}
      <Dialog open={addProductModal} onOpenChange={setAddProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un Produit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Titre</Label>
                <Input value={productForm.titre} onChange={(e) => setProductForm({...productForm, titre: e.target.value})} required />
              </div>
              <div>
                <Label>Artiste</Label>
                <Input value={productForm.artiste} onChange={(e) => setProductForm({...productForm, artiste: e.target.value})} required />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={productForm.type} onValueChange={(val) => setProductForm({...productForm, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="album">Album</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prix (€)</Label>
                <Input type="number" step="0.01" value={productForm.prix} onChange={(e) => setProductForm({...productForm, prix: e.target.value})} required />
              </div>
            </div>
            
            <div>
              <Label>Image du Produit</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} required />
              {imageFile && <p className="text-sm text-gray-600 mt-1">📷 {imageFile.name}</p>}
            </div>
            
            <div>
              <Label>Fichier Audio Preview (Extrait)</Label>
              <Input type="file" accept="audio/*" onChange={(e) => setAudioPreviewFile(e.target.files[0])} required />
              {audioPreviewFile && <p className="text-sm text-gray-600 mt-1">🎵 {audioPreviewFile.name}</p>}
            </div>
            
            <div>
              <Label>Fichier Audio Complet</Label>
              <Input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} required />
              {audioFile && <p className="text-sm text-gray-600 mt-1">🎵 {audioFile.name}</p>}
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddProductModal(false)} disabled={uploading}>Annuler</Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Téléchargement...' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={editProductModal} onOpenChange={setEditProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le Produit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Titre</Label>
                <Input value={productForm.titre} onChange={(e) => setProductForm({...productForm, titre: e.target.value})} />
              </div>
              <div>
                <Label>Artiste</Label>
                <Input value={productForm.artiste} onChange={(e) => setProductForm({...productForm, artiste: e.target.value})} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={productForm.type} onValueChange={(val) => setProductForm({...productForm, type: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="album">Album</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prix (€)</Label>
                <Input type="number" step="0.01" value={productForm.prix} onChange={(e) => setProductForm({...productForm, prix: e.target.value})} />
              </div>
            </div>
            
            <div>
              <Label>Nouvelle Image (optionnel)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
              {imageFile && <p className="text-sm text-gray-600 mt-1">📷 {imageFile.name}</p>}
              {!imageFile && selectedProduct && (
                <p className="text-sm text-gray-500 mt-1">Image actuelle conservée</p>
              )}
            </div>
            
            <div>
              <Label>Nouveau Fichier Audio Preview (optionnel)</Label>
              <Input type="file" accept="audio/*" onChange={(e) => setAudioPreviewFile(e.target.files[0])} />
              {audioPreviewFile && <p className="text-sm text-gray-600 mt-1">🎵 {audioPreviewFile.name}</p>}
              {!audioPreviewFile && selectedProduct && (
                <p className="text-sm text-gray-500 mt-1">Fichier audio preview actuel conservé</p>
              )}
            </div>
            
            <div>
              <Label>Nouveau Fichier Audio Complet (optionnel)</Label>
              <Input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files[0])} />
              {audioFile && <p className="text-sm text-gray-600 mt-1">🎵 {audioFile.name}</p>}
              {!audioFile && selectedProduct && (
                <p className="text-sm text-gray-500 mt-1">Fichier audio complet actuel conservé</p>
              )}
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea value={productForm.description} onChange={(e) => setProductForm({...productForm, description: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditProductModal(false)} disabled={uploading}>Annuler</Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Mise à jour...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Newsletter Modal */}
      <Dialog open={newsletterModal} onOpenChange={setNewsletterModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer une Newsletter</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendNewsletter} className="space-y-4">
            <div>
              <Label>Destinataires</Label>
              <Select value={newsletterForm.send_to} onValueChange={(val) => setNewsletterForm({...newsletterForm, send_to: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les utilisateurs</SelectItem>
                  <SelectItem value="verified">Utilisateurs vérifiés uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sujet</Label>
              <Input value={newsletterForm.subject} onChange={(e) => setNewsletterForm({...newsletterForm, subject: e.target.value})} required placeholder="Nouvelles sorties musicales" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea 
                value={newsletterForm.message} 
                onChange={(e) => setNewsletterForm({...newsletterForm, message: e.target.value})} 
                required 
                rows={6}
                placeholder="Découvrez nos dernières sorties..." 
              />
            </div>
            <p className="text-sm text-gray-600">
              💡 Vous devez configurer SendGrid dans .env pour envoyer des emails
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewsletterModal(false)}>Annuler</Button>
              <Button type="submit">Envoyer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;