import { getProviderLogs } from '@/modules/dian/actions'

import { DianConfigClient } from './_components/client'

export default async function DianPage() {
  const logs = await getProviderLogs()
  return <DianConfigClient initialLogs={logs} />
}
