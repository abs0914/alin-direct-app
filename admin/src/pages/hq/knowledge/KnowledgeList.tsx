import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export default function KnowledgeListHQ() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['hq-knowledge'],
    queryFn: () => api.get('/admin/knowledge').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/admin/knowledge/${id}`, { is_active: active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hq-knowledge'] }),
  });

  const columns: ColumnDef<Article>[] = [
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'category', header: 'Category', cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span> },
    { accessorKey: 'is_active', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<boolean>() ? 'active' : 'suspended'} /> },
    { accessorKey: 'created_at', header: 'Created', cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button
          onClick={() => toggle.mutate({ id: row.original.id, active: !row.original.is_active })}
          className="text-xs text-primary hover:underline"
        >
          {row.original.is_active ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        subtitle="Help articles fed into AI support"
        action={
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
            <Plus size={16} /> New Article
          </button>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
