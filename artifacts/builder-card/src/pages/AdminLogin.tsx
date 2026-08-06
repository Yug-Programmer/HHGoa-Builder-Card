import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useAdminLogin } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const ADMIN_TOKEN_KEY = 'hhgoa_admin_token';

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useAdminLogin();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (getAdminToken()) {
      setLocation('/superuser/dashboard');
    }
  }, [setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      const result = await loginMutation.mutateAsync({
        data: { username, password },
      });
      setAdminToken(result.token);
      toast({ title: 'Access granted', description: 'Welcome, admin.' });
      setLocation('/superuser/dashboard');
    } catch {
      toast({
        title: 'Access denied',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/30 mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl text-white uppercase tracking-tight">Admin Panel</h1>
          <p className="font-mono text-xs text-muted-foreground mt-1 tracking-widest">HACKER HOUSE GOA 2026</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="HHGOA"
                autoComplete="username"
                className="h-11 bg-black/20 border-border focus-visible:ring-primary font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 bg-black/20 border-border focus-visible:ring-primary font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-mono font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!username || !password || loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> SIGNING IN...</>
              ) : (
                <><Lock className="w-4 h-4 mr-2" /> SIGN IN</>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center font-mono text-xs text-muted-foreground/50 mt-6">
          Restricted area — authorised access only
        </p>
      </motion.div>
    </div>
  );
}
