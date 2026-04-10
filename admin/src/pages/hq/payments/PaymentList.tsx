import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  provider: string;
  type: string;
  reference_no: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

const columns: ColumnDef<Payment>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'provider', header: 'Provider', cell: ({ getValue }) => <span className="uppercase font-medium">{getValue<string>()}</span> },
  { accessorKey: 'type', header: 'Type', cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span> },
  { accessorKey: 'reference_no', header: 'Reference', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'amount', header: 'Amount', cell: ({ getValue }) => formatCurrency(getValue<number>()) },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
  { accessorKey: 'created_at', header: 'Date', cell: ({ getValue }) => formatDate(getValue<string>()) },
];

export default function PaymentListHQ() {
  const { data, isLoading } = useQuery({
    queryKey: ['hq-payments'],
    queryFn: () => api.get('/admin/payments').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  return (
    <div>
      <PageHeader title="Payments" subtitle="All payment transactions" />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
