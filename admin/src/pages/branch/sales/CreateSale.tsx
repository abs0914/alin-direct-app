import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ArrowLeft, CreditCard, Banknote, Smartphone, Plus, Trash2,
  ChevronDown, ChevronUp, X, Search, Loader2,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────
interface SubService { slug: string; name: string }
interface ServiceGroup {
  slug: string; name: string; logo: string; color: string; initials: string;
  services: SubService[];
}
interface Beneficiary { name: string; relationship: string }
interface BeneficiaryFull { name: string; age: string; address: string; relationship: string }

interface PAIData {
  full_name: string; nationality: string; mobile: string; email: string;
  date_of_birth: string; address: string; customer_id?: number | null;
  beneficiaries: Beneficiary[];
}

// ── PAI Zod Schema ──────────────────────────────────────────────────
const paiSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  mobile: z.string().min(1, 'Mobile is required'),
  email: z.string().email('Invalid email address'),
  date_of_birth: z.string().min(1, 'Date of birth is required').refine((val) => {
    const dob = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18;
  }, 'Policyholder must be at least 18 years old'),
  address: z.string().min(1, 'Address is required'),
  customer_id: z.union([z.coerce.number(), z.null()]).optional(),
  beneficiaries: z.array(z.object({
    name: z.string().min(1, 'Beneficiary name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
  })).min(1, 'At least one beneficiary is required'),
});

type PAIFormValues = z.infer<typeof paiSchema>;

interface StPeterData {
  plan_types: string[];
  contract_price: string; total_amount_payable: string;
  payment_mode: string; payment_type: string; terms_years: string;
  insurability: string; installment_due: string;
  last_name: string; first_name: string; middle_name: string;
  lot_no: string; street: string; barangay: string; district: string;
  city: string; province: string; zip_code: string;
  office_address: string; nationality: string; date_of_naturalization: string;
  residency: string; mail_to: string;
  contact_no: string; email: string; date_of_birth: string; place_of_birth: string;
  sex: string; height: string; weight: string; civil_status: string;
  occupation: string; employer: string; employment_status: string;
  tin: string; sss_gsis: string; source_of_funds: string;
  primary_beneficiaries: BeneficiaryFull[];
  contingent_beneficiaries: BeneficiaryFull[];
  health_details: string;
  signed_place: string; signed_date: string; agent_name: string;
}

// ── Service Groups ───────────────────────────────────────────────────
const SERVICE_GROUPS: ServiceGroup[] = [
  {
    slug: 'alin-cargo', name: 'ALiN Cargo', logo: '/logos/alincargo logo.png',
    color: '#E85D04', initials: 'AC',
    services: [
      { slug: 'cargo-parcel-delivery', name: 'Parcel Delivery' },
      { slug: 'cargo-parcel-receiving', name: 'Parcel Receiving' },
    ],
  },
  {
    slug: 'alin-travel', name: 'ALiN Travel', logo: '/logos/alin travels logo.png',
    color: '#F5A524', initials: 'AT',
    services: [
      { slug: 'travel-hotel-airline', name: 'Hotel / Airline Booking' },
      { slug: 'travel-tours', name: 'Travel and Tours' },
    ],
  },
  {
    slug: 'cebuana', name: 'Cebuana Lhullier', logo: '/logos/cebuana logo.png',
    color: '#1B2D6B', initials: 'CL',
    services: [
      { slug: 'cebuana-bills-payment', name: 'Cebuana Bills Payment' },
      { slug: 'cebuana-cash-in', name: 'Cebuana Cash In' },
      { slug: 'cebuana-cash-out', name: 'Cebuana Cash Out' },
      { slug: 'cebuana-domestic-remittance', name: 'Cebuana Domestic Remittance' },
      { slug: 'cebuana-international-remittance', name: 'Cebuana International Remittance' },
    ],
  },
  {
    slug: 'ecpay', name: 'Ecpay', logo: '/logos/ecpay logo.png',
    color: '#4CAF50', initials: 'EP',
    services: [
      { slug: 'ecpay-cash-in', name: 'Ecpay Cash In' },
      { slug: 'ecpay-cash-out', name: 'Ecpay Cash Out' },
      { slug: 'ecpay-load', name: 'Ecpay Load' },
      { slug: 'ecpay-payment', name: 'ECPay Payment' },
    ],
  },
  {
    slug: 'st-peter', name: 'St. Peter', logo: '/logos/stpeter logo.png',
    color: '#2D6A4F', initials: 'SP',
    services: [
      { slug: 'st-peter-life-plan', name: 'St. Peter Life Plan' },
    ],
  },
  {
    slug: 'lottomatik', name: 'Lottomatik', logo: '/logos/lottomatik logo.png',
    color: '#1565C0', initials: 'LM',
    services: [
      { slug: 'lottomatik', name: 'Lottomatik' },
    ],
  },
  {
    slug: 'stronghold', name: 'Stronghold Insurance', logo: '/logos/stronghold logo.png',
    color: '#0288D1', initials: 'SI',
    services: [
      { slug: 'stronghold-pa', name: 'Personal Accident Insurance' },
      { slug: 'stronghold-ctpl', name: 'CTPL Motor Vehicle Insurance' },
    ],
  },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'gcash', label: 'GCash', icon: Smartphone },
  { value: 'maya', label: 'Maya', icon: CreditCard },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: CreditCard },
  { value: 'cod', label: 'COD', icon: Banknote },
];

const SP_PLAN_TYPES = [
  'St. Claire', 'St. Anne', 'St. Bernadette', 'St. George',
  'St. Dominique', 'St. Gregory', 'St. Helen', 'St. Hyacinth',
];

// ── Shared UI helpers ────────────────────────────────────────────────
const inputCls = 'w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors';

function Field({ label, children, half }: { label: string; children: React.ReactNode; half?: boolean }) {
  return (
    <div className={half ? '' : ''}>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4 pb-2 border-t border-border">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{children}</p>
    </div>
  );
}

function LogoImg({ src, alt, color, initials, size = 'md' }: {
  src: string; alt: string; color: string; initials: string; size?: 'sm' | 'md';
}) {
  const [err, setErr] = useState(false);
  const dim = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
  if (err) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg font-bold text-white shrink-0', dim)}
           style={{ backgroundColor: color }}>
        {initials}
      </div>
    );
  }
  return (
    <img src={src} alt={alt}
         className={cn('object-contain bg-white rounded-lg border border-border p-0.5 shrink-0', dim)}
         onError={() => setErr(true)} />
  );
}

// ── Modal wrapper ────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={cn('relative bg-card rounded-xl shadow-2xl w-full', wide ? 'max-w-3xl' : 'max-w-xl')}>
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-3">{children}</div>
      </div>
    </div>
  );
}

// ── PAI Enrollment Dialog ────────────────────────────────────────────
function PAIDialog({ open, onClose, onSubmit, saving }: {
  open: boolean; onClose: () => void;
  onSubmit: (data: PAIFormValues) => void | Promise<void>; saving?: boolean;
}) {
  const { register, control, handleSubmit, formState: { errors }, reset } = useForm<PAIFormValues>({
    resolver: zodResolver(paiSchema),
    defaultValues: {
      full_name: '', nationality: 'Filipino', mobile: '', email: '',
      date_of_birth: '', address: '', customer_id: null,
      beneficiaries: [{ name: '', relationship: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'beneficiaries' });

  // Customer search for linking
  const [custSearch, setCustSearch] = useState('');
  const [custDropdown, setCustDropdown] = useState(false);
  const { data: customers = [] } = useQuery({
    queryKey: ['branch-customers-search', custSearch],
    queryFn: () => api.get('/branch-admin/customers', { params: { search: custSearch } }).then((r) => r.data.data ?? r.data),
    enabled: custSearch.length >= 2,
  });

  const filteredCust = useMemo(() =>
    (customers as any[]).slice(0, 10), [customers]);

  const errCls = 'text-xs text-red-500 mt-0.5';

  const doSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal open={open} onClose={handleClose} title="Personal Accident Insurance — Enrollment">
      {/* Coverage summary */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-muted-foreground">Accidental Death</span><span className="block font-bold text-foreground">₱100,000</span></div>
        <div><span className="text-muted-foreground">Murder &amp; Assault</span><span className="block font-bold text-foreground">₱10,000</span></div>
        <div><span className="text-muted-foreground">Medical Reimbursement</span><span className="block font-bold text-foreground">₱5,000</span></div>
        <div><span className="text-muted-foreground">Burial Benefits</span><span className="block font-bold text-foreground">₱5,000</span></div>
      </div>

      <SectionTitle>Link to Customer (optional)</SectionTitle>
      <Controller control={control} name="customer_id" render={({ field }) => (
        <div className="relative">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className={cn(inputCls, 'pl-8')} placeholder="Search customer by name or phone…"
              value={custSearch}
              onChange={(e) => { setCustSearch(e.target.value); setCustDropdown(true); }}
              onFocus={() => setCustDropdown(true)} />
          </div>
          {custDropdown && filteredCust.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredCust.map((c: any) => (
                <button key={c.id} type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                  onClick={() => {
                    field.onChange(Number(c.id));
                    setCustSearch(c.user?.name ?? `Customer #${c.id}`);
                    setCustDropdown(false);
                  }}>
                  <span className="font-medium">{c.user?.name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{c.user?.phone}</span>
                </button>
              ))}
            </div>
          )}
          {field.value && (
            <button type="button" onClick={() => { field.onChange(null); setCustSearch(''); }}
              className="text-xs text-red-500 hover:underline mt-1">Clear selection</button>
          )}
        </div>
      )} />

      <SectionTitle>Policyholder Details</SectionTitle>
      <Field label="Full Name *">
        <input className={inputCls} {...register('full_name')} />
        {errors.full_name && <p className={errCls}>{errors.full_name.message}</p>}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nationality *">
          <input className={inputCls} {...register('nationality')} />
          {errors.nationality && <p className={errCls}>{errors.nationality.message}</p>}
        </Field>
        <Field label="Date of Birth * (18+)">
          <input type="date" className={inputCls} {...register('date_of_birth')} />
          {errors.date_of_birth && <p className={errCls}>{errors.date_of_birth.message}</p>}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mobile *">
          <input className={inputCls} placeholder="+63 9XX XXX XXXX" {...register('mobile')} />
          {errors.mobile && <p className={errCls}>{errors.mobile.message}</p>}
        </Field>
        <Field label="Email *">
          <input type="email" className={inputCls} {...register('email')} />
          {errors.email && <p className={errCls}>{errors.email.message}</p>}
        </Field>
      </div>
      <Field label="Address *">
        <textarea className={inputCls} rows={2} {...register('address')} />
        {errors.address && <p className={errCls}>{errors.address.message}</p>}
      </Field>

      <SectionTitle>Beneficiaries</SectionTitle>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex gap-2">
            <div className="flex-1">
              <input placeholder="Full Name" className={cn(inputCls, 'w-full')} {...register(`beneficiaries.${i}.name`)} />
              {errors.beneficiaries?.[i]?.name && <p className={errCls}>{errors.beneficiaries[i]?.name?.message}</p>}
            </div>
            <div className="w-36">
              <input placeholder="Relationship" className={cn(inputCls, 'w-full')} {...register(`beneficiaries.${i}.relationship`)} />
              {errors.beneficiaries?.[i]?.relationship && <p className={errCls}>{errors.beneficiaries[i]?.relationship?.message}</p>}
            </div>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => append({ name: '', relationship: '' })}
          className="flex items-center gap-1 text-xs text-primary hover:underline">
          <Plus size={14} /> Add Beneficiary
        </button>
        {errors.beneficiaries?.root && <p className={errCls}>{errors.beneficiaries.root.message}</p>}
      </div>

      <div className="flex gap-3 pt-4 border-t border-border">
        <button type="button" onClick={handleClose}
          className="flex-1 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
        <button type="button" disabled={saving} onClick={doSubmit}
          className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
            'bg-[#F5A010] text-white hover:opacity-90 disabled:opacity-50'
          )}
        >
          {saving ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Saving…</span> : 'Save Enrollment'}
        </button>
      </div>
    </Modal>
  );
}

// ── St. Peter Life Plan Dialog ───────────────────────────────────────
const defaultSP: StPeterData = {
  plan_types: [], contract_price: '', total_amount_payable: '',
  payment_mode: '', payment_type: '', terms_years: '',
  insurability: 'insurable', installment_due: '',
  last_name: '', first_name: '', middle_name: '',
  lot_no: '', street: '', barangay: '', district: '',
  city: '', province: '', zip_code: '',
  office_address: '', nationality: 'Filipino', date_of_naturalization: '',
  residency: 'resident', mail_to: 'residence',
  contact_no: '', email: '', date_of_birth: '', place_of_birth: '',
  sex: '', height: '', weight: '', civil_status: '',
  occupation: '', employer: '', employment_status: '',
  tin: '', sss_gsis: '', source_of_funds: '',
  primary_beneficiaries: [
    { name: '', age: '', address: '', relationship: '' },
    { name: '', age: '', address: '', relationship: '' },
    { name: '', age: '', address: '', relationship: '' },
  ],
  contingent_beneficiaries: [
    { name: '', age: '', address: '', relationship: '' },
    { name: '', age: '', address: '', relationship: '' },
  ],
  health_details: '',
  signed_place: '', signed_date: '', agent_name: '',
};

function StPeterDialog({ open, onClose, onSubmit }: {
  open: boolean; onClose: () => void; onSubmit: (data: StPeterData) => void;
}) {
  const [d, setD] = useState<StPeterData>(defaultSP);
  const set = (k: keyof StPeterData, v: any) => setD((p) => ({ ...p, [k]: v }));

  const togglePlanType = (t: string) =>
    setD((p) => ({
      ...p,
      plan_types: p.plan_types.includes(t) ? p.plan_types.filter((x) => x !== t) : [...p.plan_types, t],
    }));

  const setPrimBen = (i: number, k: keyof BeneficiaryFull, v: string) =>
    setD((p) => { const b = [...p.primary_beneficiaries]; b[i] = { ...b[i], [k]: v }; return { ...p, primary_beneficiaries: b }; });
  const setContBen = (i: number, k: keyof BeneficiaryFull, v: string) =>
    setD((p) => { const b = [...p.contingent_beneficiaries]; b[i] = { ...b[i], [k]: v }; return { ...p, contingent_beneficiaries: b }; });

  const canSubmit = d.plan_types.length > 0 && d.last_name && d.first_name && d.date_of_birth;

  const radioBtn = (name: string, value: string, current: string, onChange: (v: string) => void, label: string) => (
    <label key={value} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all',
      current === value ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/40')}>
      <input type="radio" name={name} value={value} checked={current === value} onChange={() => onChange(value)} className="accent-primary" />
      {label}
    </label>
  );

  return (
    <Modal open={open} onClose={onClose} title="St. Peter Life Plan — Application Form" wide>
      {/* ── PART I ── */}
      <SectionTitle>Part I — Plan Data</SectionTitle>

      <Field label="Plan Type *">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
          {SP_PLAN_TYPES.map((t) => (
            <label key={t} className={cn('flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs cursor-pointer transition-all',
              d.plan_types.includes(t) ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/40')}>
              <input type="checkbox" checked={d.plan_types.includes(t)} onChange={() => togglePlanType(t)} className="accent-primary" />
              {t}
            </label>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contract Price (₱)">
          <input type="number" className={inputCls} value={d.contract_price} onChange={(e) => set('contract_price', e.target.value)} />
        </Field>
        <Field label="Total Amount Payable (₱)">
          <input type="number" className={inputCls} value={d.total_amount_payable} onChange={(e) => set('total_amount_payable', e.target.value)} />
        </Field>
      </div>

      <Field label="Mode of Payment">
        <div className="flex flex-wrap gap-2 mt-1">
          {(['annual', 'semi_annual', 'quarterly', 'monthly'] as const).map((m) =>
            radioBtn('payment_mode', m, d.payment_mode, (v) => set('payment_mode', v),
              { annual: 'Annual', semi_annual: 'Semi-Annual', quarterly: 'Quarterly', monthly: 'Monthly' }[m])
          )}
        </div>
      </Field>

      <div className="flex flex-wrap gap-4">
        <label className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all',
          d.payment_type === 'spot_cash' ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/40')}>
          <input type="radio" name="payment_type" checked={d.payment_type === 'spot_cash'} onChange={() => set('payment_type', 'spot_cash')} className="accent-primary" />
          Spot Cash
        </label>
        <label className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all',
          d.payment_type === 'terms' ? 'border-primary bg-primary/10 font-medium' : 'border-border hover:border-primary/40')}>
          <input type="radio" name="payment_type" checked={d.payment_type === 'terms'} onChange={() => set('payment_type', 'terms')} className="accent-primary" />
          Terms
          {d.payment_type === 'terms' && (
            <input type="number" className="w-16 border border-border rounded px-2 py-1 text-sm" placeholder="Yrs"
              value={d.terms_years} onChange={(e) => set('terms_years', e.target.value)} />
          )}
          Year(s)
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Insurability">
          <div className="flex gap-2 mt-1">
            {radioBtn('insurability', 'insurable', d.insurability, (v) => set('insurability', v), 'Insurable')}
            {radioBtn('insurability', 'non_insurable', d.insurability, (v) => set('insurability', v), 'Non-Insurable')}
          </div>
        </Field>
        <Field label="Installment Due">
          <input className={inputCls} value={d.installment_due} onChange={(e) => set('installment_due', e.target.value)} />
        </Field>
      </div>

      {/* ── PART II ── */}
      <SectionTitle>Part II — Planholder's Personal Information</SectionTitle>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Last Name *">
          <input className={inputCls} value={d.last_name} onChange={(e) => set('last_name', e.target.value)} />
        </Field>
        <Field label="First Name *">
          <input className={inputCls} value={d.first_name} onChange={(e) => set('first_name', e.target.value)} />
        </Field>
        <Field label="Middle Name">
          <input className={inputCls} value={d.middle_name} onChange={(e) => set('middle_name', e.target.value)} />
        </Field>
      </div>

      <p className="text-xs font-semibold text-muted-foreground">Residential Address</p>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Lot #">
          <input className={inputCls} value={d.lot_no} onChange={(e) => set('lot_no', e.target.value)} />
        </Field>
        <Field label="Street">
          <input className={inputCls} value={d.street} onChange={(e) => set('street', e.target.value)} />
        </Field>
        <Field label="Barangay / Subdivision">
          <input className={inputCls} value={d.barangay} onChange={(e) => set('barangay', e.target.value)} />
        </Field>
        <Field label="District">
          <input className={inputCls} value={d.district} onChange={(e) => set('district', e.target.value)} />
        </Field>
        <Field label="City">
          <input className={inputCls} value={d.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Province">
          <input className={inputCls} value={d.province} onChange={(e) => set('province', e.target.value)} />
        </Field>
        <Field label="Zip Code">
          <input className={inputCls} value={d.zip_code} onChange={(e) => set('zip_code', e.target.value)} />
        </Field>
      </div>

      <Field label="Office Address">
        <textarea className={inputCls} rows={2} value={d.office_address} onChange={(e) => set('office_address', e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Nationality">
          <input className={inputCls} value={d.nationality} onChange={(e) => set('nationality', e.target.value)} />
        </Field>
        <Field label="Date of Naturalization (if applicable)">
          <input type="date" className={inputCls} value={d.date_of_naturalization} onChange={(e) => set('date_of_naturalization', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Residency">
          <div className="flex gap-2 mt-1">
            {radioBtn('residency', 'resident', d.residency, (v) => set('residency', v), 'Resident')}
            {radioBtn('residency', 'non_resident', d.residency, (v) => set('residency', v), 'Non-Resident')}
          </div>
        </Field>
        <Field label="Mail To / Collect At">
          <div className="flex gap-2 mt-1">
            {radioBtn('mail_to', 'office', d.mail_to, (v) => set('mail_to', v), 'Office')}
            {radioBtn('mail_to', 'residence', d.mail_to, (v) => set('mail_to', v), 'Residence')}
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact No.">
          <input className={inputCls} placeholder="+63 9XX XXX XXXX" value={d.contact_no} onChange={(e) => set('contact_no', e.target.value)} />
        </Field>
        <Field label="Email Address">
          <input type="email" className={inputCls} value={d.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Date of Birth *">
          <input type="date" className={inputCls} value={d.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
        </Field>
        <Field label="Place of Birth">
          <input className={inputCls} value={d.place_of_birth} onChange={(e) => set('place_of_birth', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Sex">
          <div className="flex gap-2 mt-1">
            {radioBtn('sex', 'male', d.sex, (v) => set('sex', v), 'Male')}
            {radioBtn('sex', 'female', d.sex, (v) => set('sex', v), 'Female')}
          </div>
        </Field>
        <Field label="Height">
          <input className={inputCls} placeholder="e.g. 165 cm" value={d.height} onChange={(e) => set('height', e.target.value)} />
        </Field>
        <Field label="Weight">
          <input className={inputCls} placeholder="e.g. 60 kg" value={d.weight} onChange={(e) => set('weight', e.target.value)} />
        </Field>
      </div>

      <Field label="Civil Status">
        <div className="flex flex-wrap gap-2 mt-1">
          {(['married', 'single', 'widower', 'separated'] as const).map((cs) =>
            radioBtn('civil_status', cs, d.civil_status, (v) => set('civil_status', v),
              { married: 'Married', single: 'Single', widower: 'Widower', separated: 'Separated / Divorced / Annulled' }[cs])
          )}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Occupation">
          <input className={inputCls} value={d.occupation} onChange={(e) => set('occupation', e.target.value)} />
        </Field>
        <Field label="Name of Employer">
          <input className={inputCls} value={d.employer} onChange={(e) => set('employer', e.target.value)} />
        </Field>
        <Field label="Status of Employment">
          <input className={inputCls} value={d.employment_status} onChange={(e) => set('employment_status', e.target.value)} />
        </Field>
        <Field label="TIN">
          <input className={inputCls} value={d.tin} onChange={(e) => set('tin', e.target.value)} />
        </Field>
        <Field label="SSS / GSIS No.">
          <input className={inputCls} value={d.sss_gsis} onChange={(e) => set('sss_gsis', e.target.value)} />
        </Field>
        <Field label="Source of Funds (if not employed)">
          <input className={inputCls} value={d.source_of_funds} onChange={(e) => set('source_of_funds', e.target.value)} />
        </Field>
      </div>

      {/* Primary Beneficiaries */}
      <SectionTitle>Primary Beneficiaries</SectionTitle>
      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
          <span className="col-span-4">Name</span>
          <span className="col-span-2">Age</span>
          <span className="col-span-3">Address</span>
          <span className="col-span-3">Relationship</span>
        </div>
        {d.primary_beneficiaries.map((b, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <span className="col-span-12 sm:hidden text-xs text-muted-foreground">Beneficiary {i + 1}</span>
            <input placeholder="Full name" className={cn(inputCls, 'col-span-12 sm:col-span-4')} value={b.name}
              onChange={(e) => setPrimBen(i, 'name', e.target.value)} />
            <input placeholder="Age" type="number" className={cn(inputCls, 'col-span-4 sm:col-span-2')} value={b.age}
              onChange={(e) => setPrimBen(i, 'age', e.target.value)} />
            <input placeholder="Address" className={cn(inputCls, 'col-span-8 sm:col-span-3')} value={b.address}
              onChange={(e) => setPrimBen(i, 'address', e.target.value)} />
            <input placeholder="Relationship" className={cn(inputCls, 'col-span-12 sm:col-span-3')} value={b.relationship}
              onChange={(e) => setPrimBen(i, 'relationship', e.target.value)} />
          </div>
        ))}
      </div>

      {/* Contingent Beneficiaries */}
      <SectionTitle>Contingent Beneficiaries</SectionTitle>
      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
          <span className="col-span-4">Name</span>
          <span className="col-span-2">Age</span>
          <span className="col-span-3">Address</span>
          <span className="col-span-3">Relationship</span>
        </div>
        {d.contingent_beneficiaries.map((b, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input placeholder="Full name" className={cn(inputCls, 'col-span-12 sm:col-span-4')} value={b.name}
              onChange={(e) => setContBen(i, 'name', e.target.value)} />
            <input placeholder="Age" type="number" className={cn(inputCls, 'col-span-4 sm:col-span-2')} value={b.age}
              onChange={(e) => setContBen(i, 'age', e.target.value)} />
            <input placeholder="Address" className={cn(inputCls, 'col-span-8 sm:col-span-3')} value={b.address}
              onChange={(e) => setContBen(i, 'address', e.target.value)} />
            <input placeholder="Relationship" className={cn(inputCls, 'col-span-12 sm:col-span-3')} value={b.relationship}
              onChange={(e) => setContBen(i, 'relationship', e.target.value)} />
          </div>
        ))}
      </div>

      {/* ── PART III ── */}
      <SectionTitle>Part III — Health Declaration</SectionTitle>
      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p>The applicant declares that at the time of purchase of his/her Life Plan:</p>
        <p>(a) His/her exact age is not below 18 years and not beyond his/her 60th Birthday.</p>
        <p>(b) He/she possesses sound health and is able to perform normal activities in pursuit of his/her livelihood.</p>
        <p>(c) He/she has not consulted any physician for heart condition, hypertension, cancer, diabetes, lungs, kidneys or intestinal disorder, tuberculosis, or any other physical impairment nor has been confined in a hospital/clinic.</p>
      </div>
      <Field label="If applicable, state results of consultations / confinements:">
        <textarea className={inputCls} rows={3} value={d.health_details}
          onChange={(e) => set('health_details', e.target.value)}
          placeholder="Leave blank if no prior consultations or confinements." />
      </Field>

      {/* ── Authorization ── */}
      <SectionTitle>Authorization</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date Signed">
          <input type="date" className={inputCls} value={d.signed_date} onChange={(e) => set('signed_date', e.target.value)} />
        </Field>
        <Field label="Place Signed">
          <input className={inputCls} value={d.signed_place} onChange={(e) => set('signed_place', e.target.value)} />
        </Field>
        <Field label="Sales Agent Name">
          <input className={inputCls} value={d.agent_name} onChange={(e) => set('agent_name', e.target.value)} />
        </Field>
      </div>

      <p className="text-[11px] text-muted-foreground italic border border-border rounded-lg p-2 bg-muted/30">
        THIS PROVISIONAL RECEIPT IS VALID ONLY IF IT IS CONFIRMED BY AN OFFICIAL RECEIPT. PLEASE DEMAND FOR AN OFFICIAL RECEIPT EACH TIME A PAYMENT IS MADE.
      </p>

      <div className="flex gap-3 pt-4 border-t border-border">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
        <button
          disabled={!canSubmit}
          onClick={() => { onSubmit(d); onClose(); }}
          className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all',
            canSubmit ? 'bg-primary text-primary-foreground hover:opacity-90' : 'bg-muted text-muted-foreground cursor-not-allowed'
          )}
        >
          Save Application
        </button>
      </div>
    </Modal>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export default function CreateSale() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Dialogs
  const [showPAI, setShowPAI] = useState(false);
  const [showStPeter, setShowStPeter] = useState(false);
  const [paiData, setPaiData] = useState<PAIData | null>(null);
  const [stPeterData, setStPeterData] = useState<StPeterData | null>(null);
  const [personalAccidentInsuranceId, setPersonalAccidentInsuranceId] = useState<number | null>(null);
  const [paiSaving, setPaiSaving] = useState(false);

  // Payment fields
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const save = useMutation({
    mutationFn: (payload: any) => api.post('/branch-admin/sales', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-sales'] });
      navigate('/branch/sales');
    },
  });

  const selectedService = SERVICE_GROUPS.flatMap((g) => g.services).find((s) => s.slug === selectedSlug);
  const selectedGroup = SERVICE_GROUPS.find((g) => g.services.some((s) => s.slug === selectedSlug));
  const canSubmit = selectedSlug && parseFloat(amount) > 0 && !save.isPending;

  const needsDialog = (slug: string | null) => slug === 'stronghold-pa' || slug === 'st-peter-life-plan';
  const dialogDone = selectedSlug === 'stronghold-pa' ? !!paiData : selectedSlug === 'st-peter-life-plan' ? !!stPeterData : true;

  const handleGroupClick = (group: ServiceGroup) => {
    if (group.services.length === 1) {
      const slug = group.services[0].slug;
      setSelectedSlug(slug);
      setExpandedGroup(expandedGroup === group.slug ? null : group.slug);
      if (slug === 'stronghold-pa') { setPaiData(null); setPersonalAccidentInsuranceId(null); setShowPAI(true); }
      if (slug === 'st-peter-life-plan') { setStPeterData(null); setShowStPeter(true); }
    } else {
      setExpandedGroup(expandedGroup === group.slug ? null : group.slug);
    }
  };

  const handleServiceClick = (slug: string, groupSlug: string) => {
    setSelectedSlug(slug);
    setExpandedGroup(groupSlug);
    if (slug === 'stronghold-pa') { setPaiData(null); setPersonalAccidentInsuranceId(null); setShowPAI(true); }
    if (slug === 'st-peter-life-plan') { setStPeterData(null); setShowStPeter(true); }
  };

  const handleSubmit = () => {
    if (!selectedSlug || !amount) return;
    const payload: any = {
      service_slug: selectedSlug,
      amount: parseFloat(amount),
      payment_method: paymentMethod,
      customer_name: customerName,
      reference_number: referenceNumber,
      notes,
    };
    if (selectedSlug === 'stronghold-pa' && personalAccidentInsuranceId) {
      payload.personal_accident_insurance_id = personalAccidentInsuranceId;
    }
    if (selectedSlug === 'st-peter-life-plan' && stPeterData) payload.st_peter = stPeterData;
    save.mutate(payload);
  };

  return (
    <>
      {/* Dialogs */}
      <PAIDialog
        open={showPAI}
        saving={paiSaving}
        onClose={() => { setShowPAI(false); if (!paiData) setSelectedSlug(null); }}
        onSubmit={async (data) => {
          try {
            setPaiSaving(true);
            const res = await api.post('/branch-admin/personal-accident-insurance', data);
            const insurance = res.data?.data ?? res.data;
            setPaiData(data);
            setPersonalAccidentInsuranceId(insurance.id);
            setShowPAI(false);
          } catch (err) {
            console.error('PAI enrollment failed:', err);
          } finally {
            setPaiSaving(false);
          }
        }}
      />
      <StPeterDialog
        open={showStPeter}
        onClose={() => { setShowStPeter(false); if (!stPeterData) setSelectedSlug(null); }}
        onSubmit={(data) => {
          setStPeterData(data);
          setShowStPeter(false);
          if (data.contract_price) setAmount(data.contract_price);
        }}
      />

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/branch/sales')} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Create Sale</h1>
            <p className="text-sm text-muted-foreground">Select a service and fill in the details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT — Service Selection */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Select Service</h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
              {SERVICE_GROUPS.map((group) => {
                const isExpanded = expandedGroup === group.slug;
                const isGroupSelected = selectedGroup?.slug === group.slug;
                const isMulti = group.services.length > 1;
                return (
                  <div key={group.slug}>
                    <button
                      onClick={() => handleGroupClick(group)}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left',
                        isGroupSelected && 'bg-primary/5',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <LogoImg src={group.logo} alt={group.name} color={group.color} initials={group.initials} />
                        <span className={cn('text-sm font-medium', isGroupSelected ? 'text-primary font-semibold' : 'text-foreground')}>
                          {group.name}
                        </span>
                      </div>
                      {isMulti
                        ? (isExpanded ? <ChevronUp size={16} className="text-muted-foreground shrink-0" /> : <ChevronDown size={16} className="text-muted-foreground shrink-0" />)
                        : null}
                    </button>

                    {isExpanded && isMulti && (
                      <div className="bg-muted/30 divide-y divide-border/50">
                        {group.services.map((svc) => {
                          const isSelected = selectedSlug === svc.slug;
                          return (
                            <button
                              key={svc.slug}
                              onClick={() => handleServiceClick(svc.slug, group.slug)}
                              className={cn(
                                'w-full text-left px-6 py-2.5 text-sm transition-colors',
                                isSelected
                                  ? 'text-primary font-semibold bg-primary/10'
                                  : 'text-foreground hover:bg-muted/60',
                              )}
                            >
                              {svc.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT — Form & Summary */}
          <div className="lg:col-span-3 space-y-5">
            {!selectedSlug ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <p className="text-muted-foreground text-sm">Select a service from the left to begin</p>
              </div>
            ) : needsDialog(selectedSlug) && !dialogDone ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Complete the enrollment form to continue.</p>
                <button
                  onClick={() => { if (selectedSlug === 'stronghold-pa') setShowPAI(true); else setShowStPeter(true); }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90"
                >
                  Open Enrollment Form
                </button>
              </div>
            ) : (
              <>
                {/* Service header */}
                <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                  {selectedGroup && (
                    <LogoImg src={selectedGroup.logo} alt={selectedGroup.name}
                             color={selectedGroup.color} initials={selectedGroup.initials} size="sm" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{selectedService?.name}</p>
                    {needsDialog(selectedSlug) && dialogDone && (
                      <p className="text-xs text-green-600 font-medium">Enrollment form completed</p>
                    )}
                  </div>
                  {needsDialog(selectedSlug) && (
                    <button
                      onClick={() => { if (selectedSlug === 'stronghold-pa') setShowPAI(true); else setShowStPeter(true); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Edit Form
                    </button>
                  )}
                </div>

                {/* Customer name + notes */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Customer Name</label>
                    <input className={inputCls} placeholder="Walk-in customer name…" value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Notes (optional)</label>
                    <textarea className={inputCls} rows={2} placeholder="Additional notes…" value={notes}
                      onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-card rounded-xl border border-border p-5 space-y-4 lg:sticky lg:top-6">
                  <h3 className="font-semibold text-foreground">Payment Summary</h3>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Amount (PHP)</label>
                    <input type="number" min="0" step="0.01"
                      className={cn(inputCls, 'text-lg font-semibold')}
                      placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon;
                        const active = paymentMethod === pm.value;
                        return (
                          <button key={pm.value} type="button" onClick={() => setPaymentMethod(pm.value)}
                            className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all',
                              active ? 'border-primary bg-primary/10 font-medium text-primary-foreground' : 'border-border hover:border-primary/40')}>
                            <Icon size={16} className={active ? 'text-primary' : 'text-muted-foreground'} />
                            {pm.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Reference No. (optional)</label>
                    <input className={inputCls} placeholder="GCash ref, receipt no…" value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)} />
                  </div>

                  <div className="border-t border-border pt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">{formatCurrency(parseFloat(amount) || 0)}</span>
                  </div>

                  <button
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    className={cn('w-full py-3 rounded-xl text-sm font-semibold transition-all',
                      canSubmit
                        ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                  >
                    {save.isPending ? 'Processing…' : 'Complete Transaction'}
                  </button>

                  {save.isError && (
                    <p className="text-sm text-destructive text-center">Failed to save. Please try again.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
