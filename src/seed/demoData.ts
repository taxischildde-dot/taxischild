import { db } from '../lib/db';
import { writeOne } from '../lib/storage';

const DEMO_ADMIN_EMAIL = 'chef@taxi-demo.de';
const DEMO_DRIVER_EMAIL = 'sami@taxi-demo.de';
const DEMO_PASSWORD = '123456';

// Legt ein vollständiges Demo-Unternehmen an (Fahrer, Fahrzeuge, Fahrten),
// damit das System sofort ohne echte Registrierung ausprobiert werden kann.
export function seedDemoAndLogin(): void {
  let admin = db.users.byEmail(DEMO_ADMIN_EMAIL);
  let companyId: string;

  if (!admin) {
    const company = db.companies.create('Taxi Schneverdingen GmbH');
    companyId = company.id;
    admin = db.users.create({
      companyId,
      role: 'admin',
      name: 'Jonas Wagner',
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_PASSWORD,
      phone: '0170-1234567',
    });
    const driver1 = db.users.create({
      companyId,
      role: 'driver',
      name: 'Sami Hasan',
      email: DEMO_DRIVER_EMAIL,
      password: DEMO_PASSWORD,
      phone: '0170-7654321',
      employeeNumber: '12',
      licenseType: 'Personenbeförderungsschein (P-Schein)',
      workDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    });
    const driver2 = db.users.create({
      companyId,
      role: 'driver',
      name: 'Karim Odeh',
      email: 'karim@taxi-demo.de',
      password: DEMO_PASSWORD,
      phone: '0170-9998877',
      employeeNumber: '07',
      licenseType: 'Personenbeförderungsschein (P-Schein)',
      workDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    });

    const v1 = db.vehicles.create({
      companyId,
      plate: 'WL-TX 101',
      model: 'Mercedes E-Klasse',
      year: 2021,
      status: 'active',
      assignedDriverIds: [driver1.id, driver2.id],
    });
    const v2 = db.vehicles.create({
      companyId,
      plate: 'WL-TX 202',
      model: 'VW Passat',
      year: 2019,
      status: 'active',
      assignedDriverIds: [driver2.id],
    });
    db.vehicles.create({
      companyId,
      plate: 'WL-TX 303',
      model: 'Škoda Octavia',
      year: 2018,
      status: 'maintenance',
      notes: 'Vordere Bremsen werden getauscht',
    });

    const now = new Date();
    const at = (h: number, m = 0, dayOffset = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(h, m, 0, 0);
      return d.toISOString();
    };

    db.trips.create({
      companyId,
      driverId: driver1.id,
      vehicleId: v1.id,
      customerName: 'Familie Müller',
      customerPhone: '05191-22334',
      pickupAddress: 'Bahnhofstraße 12, Schneverdingen',
      destinationAddress: 'Flughafen Hamburg',
      scheduledAt: at(6, 30),
      price: 145,
      currency: 'EUR',
      status: 'completed',
      paymentMethod: 'card',
      entrySource: 'central',
      createdBy: admin.id,
    });
    db.trips.create({
      companyId,
      driverId: driver2.id,
      vehicleId: v2.id,
      customerName: 'Hans Weber',
      customerPhone: '05191-55667',
      pickupAddress: 'Marktplatz, Schneverdingen',
      destinationAddress: 'Krankenhaus Soltau',
      scheduledAt: at(9, 0),
      price: 38.5,
      currency: 'EUR',
      status: 'completed',
      paymentMethod: 'cash',
      entrySource: 'central',
      createdBy: admin.id,
    });
    db.trips.create({
      companyId,
      driverId: driver1.id,
      vehicleId: v1.id,
      customerName: 'Direktanruf-Kunde',
      customerPhone: '0170-3332211',
      pickupAddress: 'Heberer Straße 5',
      destinationAddress: 'Bahnhof Soltau',
      scheduledAt: at(11, 15),
      price: 22,
      currency: 'EUR',
      status: 'ongoing',
      paymentMethod: 'cash',
      entrySource: 'driver_phone',
      createdBy: driver1.id,
    });
    db.trips.create({
      companyId,
      driverId: driver2.id,
      customerName: 'Angela Schmidt',
      pickupAddress: 'Wilseder Straße 8',
      destinationAddress: 'Zentrum Schneverdingen',
      destinationCode: 'ROW',
      scheduledAt: at(15, 45),
      dueAt: at(15, 30),
      price: 14,
      currency: 'EUR',
      status: 'scheduled',
      paymentMethod: 'cash',
      entrySource: 'central',
      createdBy: admin.id,
    });
    // Noch nicht zugewiesene Fahrt — zeigt den "Fahrer zuweisen"-Ablauf
    db.trips.create({
      companyId,
      customerName: 'Hr. Görse',
      pickupAddress: 'Vossworth 22, Visselhövede/Hiddingen',
      destinationAddress: 'Rotenburg (Wümme)',
      destinationCode: 'ROW',
      scheduledAt: at(6, 30, 1),
      dueAt: at(6, 0, 1),
      price: 32,
      currency: 'EUR',
      status: 'scheduled',
      paymentMethod: 'invoice',
      entrySource: 'central',
      createdBy: admin.id,
    });
    db.trips.create({
      companyId,
      driverId: driver1.id,
      vehicleId: v1.id,
      customerName: 'Restaurant Orient',
      customerPhone: '05191-99887',
      pickupAddress: 'Industriestraße 3',
      destinationAddress: 'Munster',
      scheduledAt: at(10, 0, -1),
      price: 52,
      currency: 'EUR',
      status: 'completed',
      paymentMethod: 'invoice',
      entrySource: 'central',
      createdBy: admin.id,
    });
    // Beispiel-Tagesabschluss für den Stundenzettel/Fahrbericht von gestern
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(
      yesterday.getDate(),
    ).padStart(2, '0')}`;
    db.dailyLogs.upsert({
      companyId,
      driverId: driver1.id,
      date: yKey,
      patch: {
        vehicleId: v1.id,
        odometerStart: 88210,
        odometerEnd: 88395,
        workStart: '06:00',
        workEnd: '15:30',
        breakMinutes: 30,
      },
    });
  } else {
    companyId = admin.companyId;
  }

  writeOne('session', { userId: admin.id });
  // Zur geschützten Startseite wechseln, damit AuthContext die neue Sitzung einliest.
  window.location.assign('/');
}
