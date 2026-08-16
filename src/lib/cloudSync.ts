import type { Company, DailyLog, PaymentMethod, Trip, Vehicle, User } from '../types';
import { supabase } from './supabase';
import { writeAll } from './storage';

type Row = Record<string, unknown>;

const asString = (value: unknown): string | undefined => (typeof value === 'string' && value.length > 0 ? value : undefined);

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

export async function hydrateCompanyCache(companyId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const [companyResult, profilesResult, tripsResult, vehiclesResult, dailyLogsResult] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).maybeSingle(),
    supabase.from('profiles').select('*').eq('company_id', companyId),
    supabase.from('trips').select('*').eq('company_id', companyId).order('scheduled_at', { ascending: false }),
    supabase.from('vehicles').select('*').eq('company_id', companyId),
    supabase.from('daily_logs').select('*').eq('company_id', companyId).order('date', { ascending: false }),
  ]);

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
