import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Nivel Detallado (BI) - Actividades Recientes
 * 
 * Componente para mostrar datos granulares y detalles de actividades.
 * Diseñado según las recomendaciones de NotebookLM sobre dashboards jerárquicos.
 */

export interface RecentActivity {
  id: string;
  description: string;
  type: 'create' | 'update' | 'delete' | 'other';
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface RecentActivitiesTableProps {
  title?: string;
  description?: string;
  activities: RecentActivity[];
  maxItems?: number;
}

export function RecentActivitiesTable({ 
  title = 'Actividades Recientes',
  description = 'Últimas operaciones realizadas en el sistema',
  activities,
  maxItems = 10
}: RecentActivitiesTableProps) {
  const getTypeBadge = (type: RecentActivity['type']) => {
    const variants = {
      create: { label: 'Crear', variant: 'default' as const },
      update: { label: 'Editar', variant: 'secondary' as const },
      delete: { label: 'Eliminar', variant: 'destructive' as const },
      other: { label: 'Acción', variant: 'outline' as const },
    };

    const config = variants[type] || variants.other;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Hace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedActivities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No hay actividades recientes
                </TableCell>
              </TableRow>
            ) : (
              displayedActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="font-medium">
                    {activity.description}
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(activity.type)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: es })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
