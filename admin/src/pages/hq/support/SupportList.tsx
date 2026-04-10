import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';

interface Conversation {
  id: string;
  user?: { name: string };
  channel: string;
  status: string;
  intent: string;
  escalation_flag: boolean;
  last_message_at: string;
}

const columns: ColumnDef<Conversation>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorFn: (r) => r.user?.name, header: 'User' },
  { accessorKey: 'channel', header: 'Channel', cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
  { accessorKey: 'intent', header: 'Intent', cell: ({ getValue }) => getValue<string>() ?? '—' },
  {
    accessorKey: 'escalation_flag',
    header: 'Escalated',
    cell: ({ getValue }) =>
      getValue<boolean>() ? <span className="text-red-600 text-xs font-medium">YES</span> : <span className="text-muted-foreground text-xs">No</span>,
  },
  { accessorKey: 'last_message_at', header: 'Last Message', cell: ({ getValue }) => formatDate(getValue<string>()) },
];

export default function SupportListHQ() {
  const { data, isLoading } = useQuery({
    queryKey: ['hq-support'],
    queryFn: () => api.get('/admin/support').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  return (
    <div>
      <PageHeader title="Support Conversations" subtitle="All support tickets" />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
