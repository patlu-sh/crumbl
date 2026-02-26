import { cn } from '@/lib/utils';
import type { UrlItem } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface UrlListProps {
  urls: UrlItem[];
  selectedAlias: string | null;
  onSelectAlias: (alias: string) => void;
  loading?: boolean;
}

export function UrlList({ urls, selectedAlias, onSelectAlias, loading }: UrlListProps) {
  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your URLs</CardTitle>
          <CardDescription className="text-xs">Click to view analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            Loading URLs...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (urls.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your URLs</CardTitle>
          <CardDescription className="text-xs">Click to view analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
            <p>No URLs shortened yet.</p>
            <p className="text-xs">Create your first short URL above!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Your URLs</CardTitle>
        <CardDescription className="text-xs">Click to view analytics</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs px-3 h-8">Alias</TableHead>
              <TableHead className="text-xs px-3 h-8">Original URL</TableHead>
              <TableHead className="text-xs px-3 h-8 text-right">Clicks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {urls.map((url) => (
              <TableRow
                key={url.alias}
                onClick={() => onSelectAlias(url.alias)}
                className={cn(
                  'hover:bg-muted/50 cursor-pointer',
                  selectedAlias === url.alias && 'bg-muted'
                )}
              >
                <TableCell className="font-medium text-xs px-3 py-2">{url.alias}</TableCell>
                <TableCell className="max-w-md truncate text-xs px-3 py-2">{url.original_url}</TableCell>
                <TableCell className="text-right text-xs px-3 py-2">{url.total_clicks}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
