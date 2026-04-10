import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type ColumnDef } from '@tanstack/react-table';
import { api } from '@/lib/api';
import { DataTable, StatusBadge, PageHeader } from '@/components/DataTable';
import { formatDate } from '@/lib/utils';
import { Eye, X, CheckCircle, UserCheck } from 'lucide-react';

interface Conversation {
  id: string;
  channel: string; status: string; intent?: string; escalation_flag: boolean; last_message_at: string;
  user?: { name: string; phone?: string };
  cases?: Array<{ id: string; category: string; description?: string; status: string; created_at: string }>;
}

const STATUS_OPTIONS = ['open', 'bot_handling', 'pending_agent', 'agent_active', 'resolved', 'closed'];

function ConversationModal({ conv, onClose, onStatusChange, updating }: {
  conv: Conversation;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  updating: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="font-semibold">Conversation #{conv.id}</h2>
            <div className="flex gap-2 mt-1">
              <StatusBadge status={conv.status} />
              {conv.escalation_flag && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Escalated</span>}
            </div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-sm">
          {/* User */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Customer</h3>
            <p className="font-medium">{conv.user?.name ?? '—'}</p>
            {conv.user?.phone && <p className="text-muted-foreground">{conv.user.phone}</p>}
          </section>
          {/* Meta */}
          <section>
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Channel</span><p className="capitalize">{conv.channel}</p></div>
              <div><span className="text-muted-foreground">Intent</span><p>{conv.intent ?? '—'}</p></div>
              <div><span className="text-muted-foreground">Last Message</span><p>{formatDate(conv.last_message_at)}</p></div>
            </div>
          </section>
          {/* Cases */}
          {conv.cases && conv.cases.length > 0 && (
            <section>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2">Support Cases</h3>
              <div className="space-y-2">
                {conv.cases.map((c) => (
                  <div key={c.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{c.category}</span>
                      <StatusBadge status={c.status} />
                    </div>
                    {c.description && <p className="text-muted-foreground mt-1">{c.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(c.created_at)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          {/* Status Actions */}
          <section className="border-t pt-4">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.filter((s) => s !== conv.status).map((s) => (
                <button
                  key={s}
                  disabled={updating}
                  onClick={() => onStatusChange(s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {s === 'resolved' && <CheckCircle size={12} />}
                  {s === 'agent_active' && <UserCheck size={12} />}
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function SupportListBranch() {
  const qc = useQueryClient();
  const [detail, setDetail] = useState<Conversation | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['branch-support'],
    queryFn: () => api.get('/branch-admin/support').then((r) => r.data.data ?? r.data),
    initialData: [],
    refetchInterval: 60_000,
  });

  const { data: detailData } = useQuery({
    queryKey: ['branch-support-detail', detail?.id],
    queryFn: () => detail ? api.get(`/branch-admin/support/${detail.id}`).then((r) => r.data.conversation) : null,
    enabled: !!detail,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/branch-admin/support/${id}/status`, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['branch-support'] });
      qc.invalidateQueries({ queryKey: ['branch-support-detail', vars.id] });
      setDetail((prev) => prev ? { ...prev, status: vars.status } : null);
    },
  });

  const filtered = statusFilter ? (data ?? []).filter((c: Conversation) => c.status === statusFilter) : (data ?? []);

  const columns: ColumnDef<Conversation>[] = [
    { accessorFn: (r) => r.user?.name, header: 'Customer' },
    { accessorKey: 'channel', header: 'Channel', cell: ({ getValue }) => <span className="capitalize">{getValue<string>()}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <StatusBadge status={getValue<string>()} /> },
    { accessorKey: 'intent', header: 'Intent', cell: ({ getValue }) => getValue<string>() ?? '—' },
    {
      accessorKey: 'escalation_flag', header: 'Escalated',
      cell: ({ getValue }) => getValue<boolean>()
        ? <span className="text-red-600 text-xs font-semibold">YES</span>
        : <span className="text-muted-foreground text-xs">No</span>,
    },
    { accessorKey: 'last_message_at', header: 'Last Message', cell: ({ getValue }) => formatDate(getValue<string>()) },
    {
      id: 'actions', header: '', cell: ({ row }) => (
        <button onClick={() => setDetail(row.original)} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100">
          <Eye size={12} /> View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Branch support conversations"
        action={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-md px-3 py-2 text-sm">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        }
      />
      <div className="p-6">
        <DataTable columns={columns} data={filtered} isLoading={isLoading} />
      </div>

      {detail && (
        <ConversationModal
          conv={detailData ?? detail}
          onClose={() => setDetail(null)}
          updating={updateStatus.isPending}
          onStatusChange={(status) => updateStatus.mutate({ id: detail.id, status })}
        />
      )}
    </div>
  );
}
