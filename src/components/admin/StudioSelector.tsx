import { ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStudio } from '@/contexts/StudioContext';
import type { Studio } from '@/types/database';

export function StudioSelector() {
  const { studios, selectedStudioId, setSelectedStudioId, loading } = useStudio();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
        Loading studios...
      </div>
    );
  }

  if (!studios || studios.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        No studios found
      </div>
    );
  }

  const selectedStudio = studios.find(s => s.id === selectedStudioId);

  return (
    <div className="flex items-center gap-3">
      {/* Super Admin Badge */}
      <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs">
        Super Admin
      </Badge>

      {/* Studio Selector */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedStudioId || ''} onValueChange={setSelectedStudioId}>
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <SelectValue placeholder="Select studio">
              {selectedStudio ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedStudio.name}</span>
                  {selectedStudio.location && (
                    <span className="text-muted-foreground text-xs">
                      - {selectedStudio.location}
                    </span>
                  )}
                </div>
              ) : (
                'Select studio'
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {studios.map((studio) => (
              <SelectItem key={studio.id} value={studio.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{studio.name}</span>
                  {studio.location && (
                    <span className="text-muted-foreground text-xs">
                      {studio.location}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info Text */}
      <div className="text-xs text-muted-foreground hidden sm:block">
        Viewing data for selected studio
      </div>
    </div>
  );
}
