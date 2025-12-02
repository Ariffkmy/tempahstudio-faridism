import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudioLayout } from '@/types/booking';
import { cn } from '@/lib/utils';
import { Users, Check } from 'lucide-react';

interface LayoutSelectorProps {
  layouts: StudioLayout[];
  selectedLayout: string | null;
  onSelectLayout: (layoutId: string) => void;
}

export function LayoutSelector({ layouts, selectedLayout, onSelectLayout }: LayoutSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Select Studio Layout</h3>
      
      <div className="grid gap-3">
        {layouts.map((layout) => (
          <Card
            key={layout.id}
            variant="outline"
            className={cn(
              "p-4 cursor-pointer transition-all",
              selectedLayout === layout.id 
                ? "border-primary ring-2 ring-primary/20 bg-accent/30" 
                : "hover:border-primary/50"
            )}
            onClick={() => onSelectLayout(layout.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{layout.name}</h4>
                  {selectedLayout === layout.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{layout.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {layout.capacity}
                  </Badge>
                  {layout.amenities.slice(0, 2).map((amenity) => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-primary">RM {layout.pricePerHour}</p>
                <p className="text-xs text-muted-foreground">/hour</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
