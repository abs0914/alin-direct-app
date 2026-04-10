/**
 * Branch list page — replaces Filament BranchResource (HQ panel)
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  type: string;
  city: string;
  province: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

const columns: ColumnDef<Branch>[] = [
  { accessorKey: 'code', header: 'Code' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'type', header: 'Type', cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span> },
  { accessorKey: 'city', header: 'City' },
  { accessorKey: 'province', header: 'Province' },
  { accessorKey: 'phone', header: 'Phone' },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue<boolean>() ? 'active' : 'suspended'} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Link to={`/hq/branches/${row.original.id}/edit`} className="text-xs text-primary hover:underline">
        Edit
      </Link>
    ),
  },
];

export default function BranchList() {
  const { data, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/admin/branches').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle={`${data?.length ?? 0} branches in the network`}
        action={
          <Link to="/hq/branches/new" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
            <Plus size={16} /> New Branch
          </Link>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
