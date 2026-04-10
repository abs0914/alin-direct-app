import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: string;
  is_active: boolean;
  branch?: { name: string };
  created_at: string;
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'phone', header: 'Phone', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'user_type', header: 'Role', cell: ({ getValue }) => <span className="capitalize">{getValue<string>().replace(/_/g, ' ')}</span> },
  { accessorFn: (r) => r.branch?.name, header: 'Branch', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'is_active', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<boolean>() ? 'active' : 'suspended'} /> },
  { accessorKey: 'created_at', header: 'Created', cell: ({ getValue }) => formatDate(getValue<string>()) },
];

export default function UserListHQ() {
  const { data, isLoading } = useQuery({
    queryKey: ['hq-users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  return (
    <div>
      <PageHeader title="Users" subtitle="Admin and staff accounts" />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
