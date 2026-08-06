import React, { useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetCard, getGetCardQueryKey } from '@workspace/api-client-react';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Share() {
  const [match, params] = useRoute('/cards/:id');
  const id = params?.id;

  const { data: card, isLoading, isError } = useGetCard(id || '', {
    query: {
      enabled: !!id,
      queryKey: getGetCardQueryKey(id || '')
    }
  });

  // Basic Meta Tags update
  useEffect(() => {
    if (card) {
      document.title = `${card.name}'s HH Goa Builder Card`;
      
      // Update meta tags for simple previews (Note: real SSR requires server-side OG tags)
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', `${card.name}'s HH Goa Builder Card`);

      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', card.imageUrl);

      let twitterCard = document.querySelector('meta[name="twitter:card"]');
      if (!twitterCard) {
        twitterCard = document.createElement('meta');
        twitterCard.setAttribute('name', 'twitter:card');
        document.head.appendChild(twitterCard);
      }
      twitterCard.setAttribute('content', 'summary_large_image');
    }
  }, [card]);

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-mono text-primary text-sm uppercase tracking-widest">Loading Card Data...</p>
      </div>
    );
  }

  if (isError || !card) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-serif text-white mb-4">Card Not Found</h1>
        <p className="text-muted-foreground font-mono mb-8">This builder card doesn't exist or has been removed.</p>
        <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 font-mono uppercase tracking-wider">
          Create Your Own Card
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center pt-12 pb-24 px-4 relative overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-[10%] left-[-20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px]" />
      </div>

      <header className="mb-12 text-center relative z-10 flex flex-col items-center">
        <h1 className="font-serif text-5xl md:text-6xl text-foreground uppercase tracking-tight">
          Hacker House Goa
        </h1>
        <p className="font-mono text-primary mt-2 tracking-[0.2em] uppercase text-sm">
          Verified Builder
        </p>
      </header>

      <div className="w-full max-w-4xl relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24">
        
        {/* Card Image */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl transition-all duration-500 group-hover:bg-primary/30 group-hover:blur-2xl" />
          <img 
            src={card.imageUrl} 
            alt={`${card.name}'s Builder Card`} 
            className="relative w-full max-w-[360px] rounded-2xl shadow-2xl border border-white/10"
          />
        </div>

        {/* Info & CTA */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-md">
          <h2 className="font-serif text-5xl text-white uppercase leading-none mb-2">{card.name}</h2>
          
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
            {card.builderTitle && (
              <span className="font-mono text-background font-bold text-xs uppercase bg-primary px-2 py-1 rounded">
                {card.builderTitle}
              </span>
            )}
            {card.role && (
              <span className="font-mono text-white/90 text-xs uppercase px-2 py-1 border border-white/20 rounded bg-black/20">
                {card.role}
              </span>
            )}
            {card.country && (
              <span className="font-mono text-white/90 text-xs uppercase px-2 py-1 border border-white/20 rounded bg-black/20">
                {card.country}
              </span>
            )}
          </div>

          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent lg:via-white/20 lg:to-transparent lg:from-white/20 mb-8" />

          <p className="font-mono text-muted-foreground text-sm mb-6 max-w-sm">
            Join the most exciting hacker community event in India. Build your identity and secure your spot.
          </p>

          <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-base font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8 font-mono uppercase tracking-wider w-full sm:w-auto shadow-lg shadow-secondary/20">
            CREATE YOUR OWN CARD <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
