import React, { useState } from 'react';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const AuthModal = ({ open, onClose }) => {
  const { login, register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);

  // Login form
  const [loginData, setLoginData] = useState({ email: '', mot_de_passe: '' });

  // Register form
  const [registerData, setRegisterData] = useState({
    prenom: '',
    nom: '',
    email: '',
    adresse: '',
    mot_de_passe: '',
    confirm_password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.mot_de_passe);
      toast.success('Connexion réussie !');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.mot_de_passe !== registerData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      const response = await register({
        prenom: registerData.prenom,
        nom: registerData.nom,
        email: registerData.email,
        adresse: registerData.adresse,
        mot_de_passe: registerData.mot_de_passe
      });
      
      setVerificationToken(response.verification_token);
      toast.success('Inscription réussie ! Vérifiez votre email.');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="auth-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Connexion / Inscription
          </DialogTitle>
        </DialogHeader>

        {verificationToken ? (
          <div className="space-y-4" data-testid="verification-message">
            <p className="text-sm text-gray-600">
              Un email de vérification a été envoyé à votre adresse.
            </p>
            <p className="text-xs text-gray-500">
              Pour tester : <a href={`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-email/${verificationToken}`} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">Cliquez ici pour vérifier</a>
            </p>
            <Button onClick={() => { setVerificationToken(null); onClose(); }} className="w-full">
              Fermer
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Connexion</TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    data-testid="login-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Mot de passe</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.mot_de_passe}
                    onChange={(e) => setLoginData({ ...loginData, mot_de_passe: e.target.value })}
                    required
                    data-testid="login-password-input"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4" data-testid="register-form">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input
                      id="prenom"
                      value={registerData.prenom}
                      onChange={(e) => setRegisterData({ ...registerData, prenom: e.target.value })}
                      required
                      data-testid="register-prenom-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom</Label>
                    <Input
                      id="nom"
                      value={registerData.nom}
                      onChange={(e) => setRegisterData({ ...registerData, nom: e.target.value })}
                      required
                      data-testid="register-nom-input"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    data-testid="register-email-input"
                  />
                </div>
                <div>
                  <Label htmlFor="adresse">Adresse</Label>
                  <Input
                    id="adresse"
                    value={registerData.adresse}
                    onChange={(e) => setRegisterData({ ...registerData, adresse: e.target.value })}
                    required
                    data-testid="register-adresse-input"
                  />
                </div>
                <div>
                  <Label htmlFor="register-password">Mot de passe</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.mot_de_passe}
                    onChange={(e) => setRegisterData({ ...registerData, mot_de_passe: e.target.value })}
                    required
                    data-testid="register-password-input"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={registerData.confirm_password}
                    onChange={(e) => setRegisterData({ ...registerData, confirm_password: e.target.value })}
                    required
                    data-testid="register-confirm-password-input"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="register-submit-btn">
                  {loading ? 'Inscription...' : "S'inscrire"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;