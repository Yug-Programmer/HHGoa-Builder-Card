import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <AlertCircle className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-4xl font-serif text-white mb-4 uppercase">
        404 - Not Found
      </h1>
      <p className="text-muted-foreground font-mono mb-8">
        The page you are looking for doesn't exist.
      </p>
      <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8 font-mono uppercase tracking-wider">
        Return Home
      </Link>
    </div>
  );
}
