import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StudioLayout } from '@/types/booking';

interface LayoutCardProps {
  layout: StudioLayout;
  index: number;
}

export function LayoutCard({ layout, index }: LayoutCardProps) {
  return (
    <Card 
      variant="interactive" 
      className="overflow-hidden group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image placeholder with gradient */}
      <div className="aspect-[4/3] bg-gradient-to-br from-muted to-accent/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-4 left-4 right-4">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
            <Users className="h-3 w-3 mr-1" />
            Up to {layout.capacity} people
          </Badge>
        </div>
      </div>

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-semibold text-lg">{layout.name}</h3>
          <div className="text-right">
            <p className="font-bold text-primary">RM {layout.pricePerHour}</p>
            <p className="text-xs text-muted-foreground">per hour</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {layout.description}
        </p>

        <Button className="w-full group-hover:bg-primary/90" asChild>
          <Link to={`/book?layout=${layout.id}`}>
            Book This Studio
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
