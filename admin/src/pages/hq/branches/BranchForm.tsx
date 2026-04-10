/**
 * Create / Edit branch form — replaces Filament BranchResource create/edit pages
 */
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/DataTable';

interface BranchFormData {
  name: string;
  code: string;
  type: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  service_radius_km: number;
  is_active: boolean;
}

export default function BranchForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BranchFormData>({
    defaultValues: { type: 'branch', service_radius_km: 10, is_active: true },
  });

  useQuery({
    queryKey: ['branch', id],
    queryFn: () => api.get(`/admin/branches/${id}`).then((r) => { reset(r.data); return r.data; }),
    enabled: isEdit,
  });

  const mutation = useMutation({
    mutationFn: (data: BranchFormData) =>
      isEdit ? api.put(`/admin/branches/${id}`, data) : api.post('/admin/branches', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] });
      navigate('/hq/branches');
    },
  });

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Branch' : 'New Branch'} />
      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4 bg-white rounded-lg border p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Branch Name *</label>
              <input {...register('name', { required: true })} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Code *</label>
              <input {...register('code', { required: true })} className="mt-1 w-full border rounded-md px-3 py-2 text-sm uppercase" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select {...register('type')} className="mt-1 w-full border rounded-md px-3 py-2 text-sm">
                <option value="branch">Branch</option>
                <option value="hub">Hub</option>
                <option value="satellite">Satellite</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Service Radius (km)</label>
              <input type="number" {...register('service_radius_km')} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <input {...register('city')} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Province</label>
              <input {...register('province')} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <input {...register('phone')} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <input type="email" {...register('email')} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <textarea {...register('address')} rows={2} className="mt-1 w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('is_active')} id="is_active" />
            <label htmlFor="is_active" className="text-sm">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {isEdit ? 'Save Changes' : 'Create Branch'}
            </button>
            <button type="button" onClick={() => navigate('/hq/branches')} className="border px-4 py-2 rounded-md text-sm">
              Cancel
            </button>
          </div>
          {mutation.isError && <p className="text-sm text-destructive">Failed to save. Please try again.</p>}
        </form>
      </div>
    </div>
  );
}
