// docs/reference/types.ts  ->  src/types/domain.ts

export type RoomType = 'Dyshe' | 'Teke' | 'Suitë' | 'Familjare';

/** Vlerat ruhen në anglisht/uppercase; etiketat shqip vijnë nga i18n. */
export type ReservationStatus = 'RESERVED' | 'IN_HOUSE' | 'COMPLETED' | 'CANCELLED';
export type ReservationSource = 'DIREKT' | 'BOOKING' | 'TELEFON' | 'WHATSAPP' | 'RECEPSION';

export interface Room {
  id: string;            // "103" — i njëjtë me numrin e dukshëm, pa ID teknik në UI
  type: RoomType;
  capacity: number;
}

export interface Reservation {
  id: string;
  roomId: string;
  guestName: string;
  phone: string;
  persons: number;
  /** Data kalendarike ISO (YYYY-MM-DD). checkOut është dita e daljes, jo natë. */
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  source: ReservationSource;
  totalCents: number;
  paidCents: number;
  notes?: string;
  /** Ora e pritshme e mbërritjes, "14:00". Vetëm për listën e mbërritjeve. */
  expectedArrival?: string;
  externalRef?: string;  // referenca e Booking.com — NUK shfaqet në UI
  createdAt: string;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  stays: number;
  lastStay: string;      // ISO
}

export interface SyncStatus {
  ok: boolean;
  lastSyncAt: string;    // ISO
  message?: string;      // tekst shqip, shfaqet vetëm kur ok === false
}

/* ---------- Ngarkesa API ---------- */

export interface CreateReservationInput {
  roomId: string;
  guestName: string;
  phone?: string;
  persons: number;
  checkIn: string;
  nights: number;        // UI-ja punon me netë; backend-i nxjerr checkOut
  totalCents: number;
  notes?: string;
  source?: 'TELEFON' | 'RECEPSION' | 'WHATSAPP' | 'DIREKT';
}

export type ReservationEvent =
  | { type: 'reservation.created'; reservation: Reservation }
  | { type: 'reservation.updated'; reservation: Reservation }
  | { type: 'sync.status'; status: SyncStatus };

/* ---------- Ndihmës UI ---------- */

export interface CalendarBlock {
  reservation: Reservation;
  leftPx: number;
  widthPx: number;
  clippedStart: boolean;   // fillon para dritares së dukshme
  clippedEnd: boolean;
  showMeta: boolean;       // widthPx >= 132
}

export interface DaySelection {
  roomId: string;
  a: number;               // indeks dite brenda intervalit
  b: number;
}

export type CalendarView = 7 | 14 | 30;
export type Density = 'komod' | 'kompakt';
