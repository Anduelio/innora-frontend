// docs/reference/mock-data.ts  ->  src/mocks/data.ts (përdoret me MSW)
// E njëjta e dhënë si prototipi. "Sot" = 2026-09-21 (e hënë).

import type { Room, Reservation, SyncStatus } from '@/types/domain';

export const TODAY = '2026-09-21';

export const rooms: Room[] = [
  { id: '101', type: 'Dyshe', capacity: 2 },
  { id: '102', type: 'Dyshe', capacity: 2 },
  { id: '103', type: 'Dyshe', capacity: 2 },
  { id: '104', type: 'Dyshe', capacity: 2 },
  { id: '105', type: 'Teke', capacity: 1 },
  { id: '106', type: 'Dyshe', capacity: 3 },
  { id: '201', type: 'Suitë', capacity: 4 },
  { id: '202', type: 'Suitë', capacity: 4 },
  { id: '203', type: 'Familjare', capacity: 4 },
  { id: '204', type: 'Dyshe', capacity: 2 },
  { id: '301', type: 'Suitë', capacity: 4 },
  { id: '302', type: 'Dyshe', capacity: 2 },
];

const r = (
  id: string, roomId: string, guestName: string, checkIn: string, checkOut: string,
  persons: number, source: Reservation['source'], status: Reservation['status'],
  total: number, paid: number, phone: string,
  extra: Partial<Reservation> = {},
): Reservation => ({
  id, roomId, guestName, phone, persons, checkIn, checkOut, status, source,
  totalCents: total * 100, paidCents: paid * 100, createdAt: '2026-09-01T09:00:00Z', ...extra,
});

export const reservations: Reservation[] = [
  r('r1',  '101', 'Ana Kola',         '2026-09-19', '2026-09-23', 2, 'DIREKT',    'IN_HOUSE',  320, 320, '+355 69 234 5566'),
  r('r2',  '102', 'Endrit Lika',      '2026-09-20', '2026-09-22', 1, 'TELEFON',   'IN_HOUSE',   90,   0, '+355 68 411 2200'),
  r('r3',  '103', 'Arben Hoxha',      '2026-09-21', '2026-09-24', 2, 'DIREKT',    'RESERVED',  240, 100, '+355 69 123 4567',
      { expectedArrival: '14:00', notes: 'Kërkon dhomë me pamje nga deti.' }),
  r('r4',  '104', 'John Smith',       '2026-09-21', '2026-09-25', 2, 'BOOKING',   'RESERVED',  380, 380, '+44 7700 900123',
      { expectedArrival: '18:30', externalRef: 'BDC-4471902' }),
  r('r5',  '105', 'Arta Dervishi',    '2026-09-18', '2026-09-21', 1, 'DIREKT',    'IN_HOUSE',  150, 150, '+355 67 990 1122'),
  r('r6',  '203', 'Familja Krasniqi', '2026-09-19', '2026-09-21', 4, 'WHATSAPP',  'IN_HOUSE',  260, 100, '+383 44 556 677'),
  r('r7',  '201', 'Mario Rossi',      '2026-09-21', '2026-09-24', 2, 'DIREKT',    'RESERVED',  450,   0, '+39 335 778 9911',
      { expectedArrival: '16:00' }),
  r('r8',  '202', 'Sofia Müller',     '2026-09-20', '2026-09-26', 2, 'BOOKING',   'IN_HOUSE',  720, 720, '+49 151 2233 445',
      { externalRef: 'BDC-4468110' }),
  r('r9',  '106', 'Besnik Gashi',     '2026-09-20', '2026-09-23', 3, 'RECEPSION', 'IN_HOUSE',  270,  90, '+355 69 887 6543'),
  r('r10', '301', 'Luan Berisha',     '2026-09-19', '2026-09-22', 2, 'DIREKT',    'IN_HOUSE',  400, 400, '+355 69 300 1200'),
  r('r11', '204', 'Blerta Hoxhaj',    '2026-09-23', '2026-09-27', 2, 'BOOKING',   'RESERVED',  340, 340, '+355 68 220 3344'),
  r('r12', '302', 'Petrit Shala',     '2026-09-22', '2026-09-25', 2, 'DIREKT',    'RESERVED',  210,  50, '+355 69 555 7788'),
  r('r13', '105', 'Klara Meyer',      '2026-09-24', '2026-09-28', 2, 'BOOKING',   'RESERVED',  360, 360, '+49 170 6677 889'),
  r('r14', '203', 'Ilir Dema',        '2026-09-26', '2026-09-29', 4, 'TELEFON',   'RESERVED',  330,   0, '+355 67 121 3131'),
  r('r15', '101', 'Anila Prifti',     '2026-09-24', '2026-09-26', 2, 'DIREKT',    'RESERVED',  180,   0, '+355 69 444 9090'),
  r('r16', '102', 'Marco Bianchi',    '2026-09-23', '2026-09-27', 2, 'BOOKING',   'RESERVED',  300, 300, '+39 340 111 2233'),
  r('r17', '106', 'Genci Mema',       '2026-09-25', '2026-09-30', 2, 'RECEPSION', 'RESERVED',  420, 100, '+355 69 777 1234'),
  r('r18', '301', 'Erion Çela',       '2026-09-25', '2026-09-27', 2, 'DIREKT',    'CANCELLED', 200,   0, '+355 68 909 0909'),
  r('r19', '204', 'Vera Sula',        '2026-09-17', '2026-09-20', 2, 'DIREKT',    'COMPLETED', 210, 210, '+355 69 202 3040'),
];

export const syncStatus: SyncStatus = { ok: true, lastSyncAt: '2026-09-21T08:42:00Z' };

/**
 * Pritshmëritë për 2026-09-21 (përdori si teste):
 *   dhoma të zëna = 8 · të lira = 4 · mbërritje = 3 (103, 104, 201) · largime = 2 (105, 203)
 */
