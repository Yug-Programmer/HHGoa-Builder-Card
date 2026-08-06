import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  LogOut, Download, RefreshCw, Mail, Phone, Github,
  MapPin, Code, User, Search, ChevronLeft, ChevronRight,
  ShieldCheck, Users, Calendar,
} from 'lucide-react';
import { useAdminListCards } from '@workspace/api-client-react';
import type { AdminCard } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { getAdminToken, clearAdminToken } from './AdminLogin';

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function downloadCard(card: AdminCard) {
  const a = document.createElement('a');
  a.href = card.imageUrl;
  a.download = `hh-goa-${card.name.replace(/\s+/g, '-').toLowerCase()}-${card.id.slice(0, 6)}.png`;
  a.target = '_blank';
  a.click();
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCard, setSelectedCard] = useState<AdminCard | null>(null);

  const token = getAdminToken();

  useEffect(() => {
    if (!token) {
      setLocation('/superuser');
    }
  }, [token, setLocation]);

  const { data, isLoading, isError, refetch, isFetching } = useAdminListCards(
    { page, limit: PAGE_SIZE },
    {
      query: {
        enabled: !!token,
        queryKey: ['admin-cards', page],
        refetchOnWindowFocus: false,
      },
      request: {
        headers: { Authorization: `Bearer ${token}` },
      },
    },
  );

  const handleLogout = () => {
    clearAdminToken();
    setLocation('/superuser');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.toLowerCase());
    setPage(1);
  };

  const cards = data?.cards ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Client-side filter (search across visible page)
  const filtered = search
    ? cards.filter(c =>
        c.name.toLowerCase().includes(search) ||
        (c.gmail ?? '').toLowerCase().includes(search) ||
        (c.mobileNumber ?? '').toLowerCase().includes(search) ||
        (c.role ?? '').toLowerCase().includes(search) ||
        (c.githubUsername ?? '').toLowerCase().includes(search) ||
        c.id.toLowerCase().includes(search),
      )
    : cards;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      {/* Navbar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <span className="font-mono font-bold text-sm text-white tracking-wider">ADMIN</span>
              <span className="font-mono text-xs text-muted-foreground ml-2 hidden sm:inline">HH GOA 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-1 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-xs text-primary font-bold">{total} CARDS</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="font-mono text-xs text-muted-foreground hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="font-mono text-xs border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              LOGOUT
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Search + controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by name, email, phone, GitHub..."
                className="pl-9 bg-card border-border focus-visible:ring-primary font-mono text-sm"
              />
            </div>
            <Button type="submit" variant="outline" className="font-mono text-xs">SEARCH</Button>
            {search && (
              <Button type="button" variant="ghost" className="font-mono text-xs text-muted-foreground"
                onClick={() => { setSearch(''); setSearchInput(''); }}>
                CLEAR
              </Button>
            )}
          </form>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-24 text-muted-foreground font-mono">
            Failed to load cards. Check your connection and try again.
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && !isError && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-24 text-muted-foreground font-mono text-sm">
                {search ? 'No cards match your search.' : 'No cards submitted yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((card, i) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-200 group"
                  >
                    {/* Card Image */}
                    <div
                      className="relative cursor-pointer bg-black/40 aspect-[4/5] overflow-hidden"
                      onClick={() => setSelectedCard(card)}
                    >
                      <img
                        src={card.imageUrl}
                        alt={`${card.name}'s builder card`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={e => { (e.target as HTMLImageElement).src = ''; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4">
                        <span className="font-mono text-xs text-white bg-black/50 px-3 py-1 rounded-full">
                          Click to expand
                        </span>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-4 space-y-3">
                      {/* Name + ID */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-lg text-white leading-tight">{card.name}</h3>
                          {card.builderTitle && (
                            <span className="inline-block font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider">
                              {card.builderTitle}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[9px] text-muted-foreground bg-black/20 px-2 py-0.5 rounded flex-shrink-0">
                          {card.id.slice(0, 8)}...
                        </span>
                      </div>

                      {/* Public fields */}
                      <div className="space-y-1.5">
                        {card.role && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground/80 truncate">{card.role}</span>
                          </div>
                        )}
                        {card.stack && (
                          <div className="flex items-center gap-2 text-sm">
                            <Code className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground/80 truncate font-mono text-xs">{card.stack}</span>
                          </div>
                        )}
                        {card.country && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground/80 truncate">{card.country}</span>
                          </div>
                        )}
                        {card.githubUsername && (
                          <div className="flex items-center gap-2 text-sm">
                            <Github className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-foreground/80 font-mono text-xs truncate">@{card.githubUsername}</span>
                          </div>
                        )}
                      </div>

                      {/* Private fields — highlighted */}
                      <div className="border-t border-border pt-3 space-y-1.5">
                        <p className="font-mono text-[9px] text-primary/60 uppercase tracking-widest mb-2">Private Info</p>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                          <span className={`truncate font-mono text-xs ${card.gmail ? 'text-white' : 'text-muted-foreground/40 italic'}`}>
                            {card.gmail || 'Not provided'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                          <span className={`truncate font-mono text-xs ${card.mobileNumber ? 'text-white' : 'text-muted-foreground/40 italic'}`}>
                            {card.mobileNumber || 'Not provided'}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span className="font-mono text-[9px]">{formatDate(card.createdAt)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 font-mono text-[10px] border-primary/30 text-primary hover:bg-primary/10 hover:border-primary flex-shrink-0"
                          onClick={() => downloadCard(card)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          DOWNLOAD
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!search && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isFetching}
                  className="font-mono text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  PREV
                </Button>
                <span className="font-mono text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isFetching}
                  className="font-mono text-xs"
                >
                  NEXT
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Full-size image modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCard(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative max-w-sm w-full"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedCard.imageUrl}
              alt={selectedCard.name}
              className="w-full rounded-2xl shadow-2xl"
            />
            <div className="mt-4 flex gap-3">
              <Button
                className="flex-1 font-mono font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => downloadCard(selectedCard)}
              >
                <Download className="w-4 h-4 mr-2" />
                DOWNLOAD PNG
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedCard(null)}
                className="font-mono text-xs border-border"
              >
                CLOSE
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
