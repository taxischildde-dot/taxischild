import type { Company, DailyLog, PaymentMethod, Trip, Vehicle, User } from '../types';
import { isSupabaseConfigured, supabase } from './supabase';
import { writeAll } from './storage';

type Row = Record<string, unknown>;

const asString = (value: unknown): string | undefined => (typeof value === 'string' && value.length > 0 ? value : undefined);

export async function writeAuditLog(params: {
  companyId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from('audit_logs').insert({
    company_id: params.companyId,
    actor_id: params.actorId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });
  if (error) console.warn('[TaxiSchild] Audit log unavailable; core action remains saved', error.message);
}

function mapUser(row: Row): User {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    role: row.role === 'driver' ? 'driver' : 'admin',
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: asString(row.phone),
    employeeNumber: asString(row.driver_number),
    licenseType: asString(row.license_type),
    workDays: Array.isArray(row.working_days) ? (row.working_days as User['workDays']) : undefined,
    availabilityStatus: (asString(row.availability_status) as User['availabilityStatus']) ?? 'available',
    createdAt: String(row.created_at),
  };
}

export async function syncTripToCloud(trip: Trip): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase ist noch nicht konfiguriert' };
  const { error } = await supabase
    .from('trips')
    .upsert(
      {
        id: trip.id,
        company_id: trip.companyId,
        customer_name: trip.customerName,
        customer_phone: trip.customerPhone ?? null,
        pickup_address: trip.pickupAddress,
        destination_address: trip.destinationAddress,
        destination_code: trip.destinationCode ?? null,
        scheduled_at: trip.scheduledAt,
        due_at: trip.dueAt ?? null,
        price: trip.price ?? null,
        currency: trip.currency,
        status: trip.status === 'scheduled' ? 'planned' : trip.status,
        payment_method: trip.paymentMethod === 'health_insurance' ? 'krankenkasse' : trip.paymentMethod === 'municipality_school' ? 'gemeinde' : trip.paymentMethod,
        entry_source: trip.entrySource,
        driver_id: trip.driverId ?? null,
        created_by: trip.createdBy || null,
        cancellation_reason: trip.cancellationReason ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function mapTrip(row: Row): Trip {
  const status = row.status === 'planned' ? 'scheduled' : row.status === 'ongoing' ? 'ongoing' : row.status;
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    driverId: asString(row.driver_id),
    customerName: String(row.customer_name ?? ''),
    customerPhone: asString(row.customer_phone),
    pickupAddress: String(row.pickup_address ?? ''),
    destinationAddress: String(row.destination_address ?? ''),
    destinationCode: asString(row.destination_code),
    scheduledAt: String(row.scheduled_at),
    dueAt: asString(row.due_at),
    price: typeof row.price === 'number' ? row.price : row.price == null ? undefined : Number(row.price),
    currency: String(row.currency ?? 'EUR'),
    status: status as Trip['status'],
    cancellationReason: asString(row.cancellation_reason),
    paymentMethod: String(row.payment_method) as PaymentMethod,
    entrySource: row.entry_source === 'driver_phone' ? 'driver_phone' : 'central',
    createdBy: asString(row.created_by) ?? '',
    createdAt: String(row.created_at),
  };
}

export async function syncVehicleToCloud(vehicle: Vehicle): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase ist noch nicht konfiguriert' };
  const { error } = await supabase
    .from('vehicles')
    .upsert(
      {
        id: vehicle.id,
        company_id: vehicle.companyId,
        plate_number: vehicle.plate,
        model: vehicle.model,
        status: vehicle.status === 'inactive' ? 'out_of_service' : vehicle.status,
        assigned_driver_ids: vehicle.assignedDriverIds ?? (vehicle.assignedDriverId ? [vehicle.assignedDriverId] : []),
      },
      { onConflict: 'id' },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteVehicleFromCloud(companyId: string, vehicleId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase ist noch nicht konfiguriert' };
  const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId).eq('company_id', companyId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function mapVehicle(row: Row): Vehicle {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    plate: String(row.plate_number ?? ''),
    model: String(row.model ?? ''),
    status: row.status === 'out_of_service' ? 'inactive' : (row.status as Vehicle['status']),
    assignedDriverIds: Array.isArray(row.assigned_driver_ids) ? (row.assigned_driver_ids as string[]) : [],
    createdAt: String(row.created_at),
  };
}

export async function syncDailyLogToCloud(log: DailyLog): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured) return { ok: false, error: 'Supabase ist noch nicht konfiguriert' };
  const { error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        id: log.id,
        company_id: log.companyId,
        driver_id: log.driverId,
        date: log.date,
        odometer_start: log.odometerStart ?? null,
        odometer_end: log.odometerEnd ?? null,
        work_start: log.workStart ?? null,
        work_end: log.workEnd ?? null,
        break_minutes: log.breakMinutes ?? 0,
        notes: log.notes ?? null,
        updated_at: log.updatedAt,
      },
      { onConflict: 'company_id,driver_id,date' },
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function mapDailyLog(row: Row): DailyLog {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    driverId: String(row.driver_id),
    date: String(row.date),
    odometerStart: row.odometer_start == null ? undefined : Number(row.odometer_start),
    odometerEnd: row.odometer_end == null ? undefined : Number(row.odometer_end),
    workStart: asString(row.work_start),
    workEnd: asString(row.work_end),
    breakMinutes: row.break_minutes == null ? undefined : Number(row.break_minutes),
    notes: asString(row.notes),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export type HydrationScope = { userRole?: 'admin' | 'driver'; userId?: string; includeHistory?: boolean };

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Die Cloud-Anfrage hat zu lange gedauert')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function hydrateCompanyCache(companyId: string, scope: HydrationScope = {}): Promise<{ ok: true } | { ok: false; error: string }> {
  const isDriverScope = scope.userRole === 'driver' && Boolean(scope.userId);
  const recentCutoff = scope.includeHistory ? null : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const profilesQuery = isDriverScope
    ? supabase.from('profiles').select('*').eq('company_id', companyId).eq('id', scope.userId!)
    : supabase.from('profiles').select('*').eq('company_id', companyId);
  const tripsQuery = isDriverScope
    ? supabase.from('trips').select('*').eq('company_id', companyId).eq('driver_id', scope.userId!).order('scheduled_at', { ascending: false })
    : supabase.from('trips').select('*').eq('company_id', companyId).order('scheduled_at', { ascending: false });
  const logsQuery = isDriverScope
    ? supabase.from('daily_logs').select('*').eq('company_id', companyId).eq('driver_id', scope.userId!).order('date', { ascending: false })
    : supabase.from('daily_logs').select('*').eq('company_id', companyId).order('date', { ascending: false });
  if (recentCutoff) {
    tripsQuery.gte('scheduled_at', recentCutoff);
    logsQuery.gte('date', recentCutoff.slice(0, 10));
  }
  let companyResult;
  let profilesResult;
  let tripsResult;
  let vehiclesResult;
  let dailyLogsResult;
  try {
    [companyResult, profilesResult, tripsResult, vehiclesResult, dailyLogsResult] = await withTimeout(Promise.all([
      supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
      profilesQuery,
      tripsQuery,
      supabase.from('vehicles').select('*').eq('company_id', companyId),
      logsQuery,
    ]));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Die Cloud konnte nicht erreicht werden' };
  }

  const firstError = [companyResult, profilesResult, tripsResult, vehiclesResult, dailyLogsResult].find((result) => result.error)?.error;
  if (firstError) return { ok: false, error: firstError.message };
  if (!companyResult.data) return { ok: false, error: 'Das Unternehmen wurde nicht gefunden' };

  const company: Company = {
    id: String(companyResult.data.id),
    name: String(companyResult.data.name),
    createdAt: String(companyResult.data.created_at),
  };
  writeAll('companies', [company]);
  writeAll('users', (profilesResult.data ?? []).map((row) => mapUser(row as Row)));
  writeAll('trips', (tripsResult.data ?? []).map((row) => mapTrip(row as Row)));
  writeAll('vehicles', (vehiclesResult.data ?? []).map((row) => mapVehicle(row as Row)));
  writeAll('dailyLogs', (dailyLogsResult.data ?? []).map((row) => mapDailyLog(row as Row)));
  return { ok: true };
}
