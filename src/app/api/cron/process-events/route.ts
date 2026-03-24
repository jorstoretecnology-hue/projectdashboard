import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AutomationExecutorService } from '@/modules/automation/services/automation-executor.service';
import { logger } from '@/lib/logger';

/**
 * API Route para Vercel Cron.
 * Cada 1-5 minutos procesa eventos de dominio no marcados.
 */
export async function GET(req: NextRequest) {
  // 1. Seguridad: Verificar Token Secreto de Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const executor = new AutomationExecutorService(supabase);

  try {
    // 2. Obtener eventos no marcados as 'processed' (asumimos que existe esta flag o usamos logs)
    // Para simplificar, obtenemos eventos de los últimos 10 minutos que no estén en automation_logs
    const { data: events, error } = await supabase
      .from('domain_events')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) throw error;
    if (!events || events.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No events to process' });
    }

    // 3. Procesar secuencialmente (para evitar abusos de rate limit en n8n/whatsapp)
    for (const event of events) {
       await executor.processEvent(event);
    }

    return NextResponse.json({ 
       status: 'ok', 
       processed: events.length 
    });

  } catch (error: any) {
    logger.error('[Cron] Event Processor failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
