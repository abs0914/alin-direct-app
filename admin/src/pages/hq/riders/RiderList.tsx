import { useQuery } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';

interface Rider {
  id: string;
  user?: { name: string; phone: string };
  branch?: { name: string };
  vehicle_type: string;
  plate_number: string;
  status: string;
  availability: string;
  rating: number;
  total_deliveries: number;
  created_at: string;
}

const columns: ColumnDef<Rider>[] = [
  { accessorFn: (r) => r.user?.name, header: 'Name' },
  { accessorFn: (r) => r.user?.phone, header: 'Phone' },
  { accessorFn: (r) => r.branch?.name, header: 'Branch', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'vehicle_type', header: 'Vehicle', cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span> },
  { accessorKey: 'plate_number', header: 'Plate', cell: ({ getValue }) => getValue<string>() ?? '—' },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
  { accessorKey: 'availability', header: 'Avail.', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
  { accessorKey: 'rating', header: 'Rating', cell: ({ getValue }) => `⭐ ${Number(getValue<number>()).toFixed(1)}` },
  { accessorKey: 'total_deliveries', header: 'Deliveries' },
  { accessorKey: 'created_at', header: 'Joined', cell: ({ getValue }) => formatDate(getValue<string>()) },
];

export default function RiderListHQ() {
  const { data, isLoading } = useQuery({
    queryKey: ['hq-riders'],
    queryFn: () => api.get('/admin/riders').then((r) => r.data.data ?? r.data),
    initialData: [],
  });

  return (
    <div>
      <PageHeader title="Riders" subtitle="All riders across the network" />
      <div className="p-6">
        <DataTable columns={columns} data={data ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
