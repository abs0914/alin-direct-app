import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payout {
  id: string;
  rider?: { user?: { name: string } };
  amount: number;
  status: string;
  created_at: string;
}

export default function PayoutListHQ() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['hq-payouts'],
    queryFn: () => api.get('/admin/payouts').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/admin/payouts/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hq-payouts'] }),
  });

  const columns: ColumnDef<Payout>[] = [
    { accessorKey: 'id', header: 'ID' },
    { accessorFn: (r) => r.rider?.user?.name, header: 'Rider' },
    { accessorKey: 'amount', header: 'Amount', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
    { accessorKey: 'created_at', header: 'Requested', cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status === 'pending' ? (
          <button
            onClick={() => approve.mutate(row.original.id)}
            className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full hover:bg-green-200"
          >
            Approve
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="Payout Requests" subtitle="Rider cashout requests" />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
