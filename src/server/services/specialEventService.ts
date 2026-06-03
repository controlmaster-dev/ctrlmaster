import {
  listSpecialEvents,
  mapSpecialEvents,
  createSpecialEvent,
  deleteSpecialEvent,
  updateSpecialEvent,
  listSpecialEventShifts,
  replaceSpecialEventShifts,
  type SpecialEventShiftInput,
} from "@/server/repositories/specialEventRepository";
import { NotFoundError } from "@/lib/errors";

export async function getSpecialEvents() {
  const events = await listSpecialEvents();
  return mapSpecialEvents(events as unknown as Parameters<typeof mapSpecialEvents>[0]);
}

export async function addSpecialEvent(name: string, startDate: string, endDate: string) {
  return createSpecialEvent(name, startDate, endDate);
}

export async function removeSpecialEvent(id: string) {
  await deleteSpecialEvent(id);
  return { success: true as const };
}

export async function patchSpecialEvent(data: {
  id: string;
  isActive?: boolean;
  name?: string;
  startDate?: string;
  endDate?: string;
}) {
  const event = await updateSpecialEvent(data);
  if (!event) throw new NotFoundError("Evento no encontrado");
  return event;
}

export async function getSpecialEventShifts(eventId: string) {
  return listSpecialEventShifts(eventId);
}

export async function saveSpecialEventShifts(
  eventId: string,
  userId: string,
  shifts: SpecialEventShiftInput[]
) {
  await replaceSpecialEventShifts(eventId, userId, shifts);
  return { success: true as const };
}
