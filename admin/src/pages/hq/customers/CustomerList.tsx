import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';

interface Customer {
  id: string;
  user?: { name: string; phone: string; email: string };
  company_name: string;
  total_bookings: number;
  created_at: string;
}

const columns: ColumnDef<Customer>[] = [
  { accessorFn: (r) => r.user?.name, header: 'Name' },
  { accessorFn: (r) => r.user?.phone, header: 'Phone', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorFn: (r) => r.user?.email, header: 'Email', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'company_name', header: 'Company', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'total_bookings', header: 'Bookings' },
  { accessorKey: 'created_at', header: 'Joined', cell: ({ getValue }) => formatDate(getValue<string>()) },
];

export default function CustomerListHQ() {
  const { data, isLoading } = useQuery({
    queryKey: ['hq-customers'],
    queryFn: () => api.get('/admin/customers').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  return (
    <div>
      <PageHeader title="Customers" subtitle="All registered customers" />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
