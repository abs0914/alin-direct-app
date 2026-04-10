import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Clock, LogIn, LogOut, CheckCircle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  check_in_at: string;
  check_out_at?: string;
  status: string;
  notes?: string;
  attendance_date: string;
  user?: { name: string };
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status === 'checked_in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
      {status === 'checked_in' ? '🟢 Checked In' : '⬛ Checked Out'}
    </span>
  );
}

export default function Attendance() {
  const qc = useQueryClient();

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Today's branch attendance list
  const { data: records = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['branch-attendance-today'],
    queryFn: () => api.get('/branch-admin/attendance/today').then((r) => r.data.data ?? []),
    refetchInterval: 30_000,
  });

  // My own attendance for today
  const { data: myRecord } = useQuery<AttendanceRecord | null>({
    queryKey: ['branch-my-attendance'],
    queryFn: () => api.get('/branch-admin/attendance/my-today').then((r) => r.data.attendance),
    refetchInterval: 30_000,
  });

  const checkin = useMutation({
    mutationFn: () => api.post('/branch-admin/attendance/checkin', { check_in_image_path: '' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-attendance-today'] });
      qc.invalidateQueries({ queryKey: ['branch-my-attendance'] });
    },
  });

  const checkout = useMutation({
    mutationFn: (id: string) => api.put(`/branch-admin/attendance/${id}/checkout`, { check_out_image_path: '' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-attendance-today'] });
      qc.invalidateQueries({ queryKey: ['branch-my-attendance'] });
    },
  });

  const checkedIn = records.filter((r) => r.status === 'checked_in').length;
  const checkedOut = records.filter((r) => r.status === 'checked_out').length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance</h2>
        <p className="text-muted-foreground text-sm">{today}</p>
      </div>

      {/* My Attendance Card */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock size={16} /> My Attendance</h3>
        {!myRecord ? (
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">You haven't checked in today.</p>
            <button
              disabled={checkin.isPending}
              onClick={() => checkin.mutate()}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <LogIn size={16} /> Check In
            </button>
          </div>
        ) : myRecord.status === 'checked_in' ? (
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <StatusPill status={myRecord.status} />
              <p className="text-xs text-muted-foreground mt-1">Checked in at {formatDate(myRecord.check_in_at)}</p>
            </div>
            <button
              disabled={checkout.isPending}
              onClick={() => checkout.mutate(myRecord.id)}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
            >
              <LogOut size={16} /> Check Out
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-green-700"><CheckCircle size={16} /><span className="font-medium">Completed for today</span></div>
            <p className="text-xs text-muted-foreground mt-1">In: {formatDate(myRecord.check_in_at)} · Out: {formatDate(myRecord.check_out_at)}</p>
          </div>
        )}
      </div>

      {/* Branch summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold">{records.length}</p>
          <p className="text-sm text-muted-foreground">Total Present</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{checkedIn}</p>
          <p className="text-sm text-muted-foreground">Checked In</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-gray-500">{checkedOut}</p>
          <p className="text-sm text-muted-foreground">Checked Out</p>
        </div>
      </div>

      {/* Attendance list */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold">Branch Staff Today</h3>
        </div>
        {isLoading ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">Loading…</p>
        ) : records.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground text-center">No attendance records yet today.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Check In', 'Check Out', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(r.check_in_at)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.check_out_at ? formatDate(r.check_out_at) : '—'}</td>
                  <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
