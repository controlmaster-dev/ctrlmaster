


import { UserSchedule } from '@/types/schedule';


export const USER_SCHEDULES: Record<string, UserSchedule> = {
  Gabriel: {
    userId: 'gabriel',
    userName: 'Gabriel',
    shifts: [
      {
        days: [0, 1, 2, 3, 4],
        start: 6,
        end: 18,
      },
    ],
    label: 'Dom-Jue 6am-6pm',
  },
  Diego: {
    userId: 'diego',
    userName: 'Diego',
    shifts: [
      {
        days: [1, 2],
        start: 0,
        end: 6,
      },
      {
        days: [3, 4],
        start: 18,
        end: 24,
      },
      {
        days: [6],
        start: 6,
        end: 12,
      },
    ],
    label: 'Mixto (Lun-Mar Madrugada, Mie-Jue Tarde, Sab Mañana)',
  },
  Alex: {
    userId: 'alex',
    userName: 'Alex',
    shifts: [
      {
        days: [1, 2, 3, 4, 5],
        start: 6,
        end: 15,
      },
    ],
    label: 'Lun-Vie 6am-3pm',
  },
  Andres: {
    userId: 'andres',
    userName: 'Andres',
    shifts: [
      {
        days: [4, 5, 6, 0, 1],
        start: 8,
        end: 18,
      },
    ],
    label: 'Jue-Lun 8am-6pm',
  },
  Josue: {
    userId: 'josue',
    userName: 'Josue',
    shifts: [
      {
        days: [3, 4, 5, 6, 0],
        start: 0,
        end: 6,
      },
    ],
    label: 'Mie-Dom 12am-6am',
  },
  Jeremy: {
    userId: 'jeremy',
    userName: 'Jeremy',
    shifts: [
      {
        days: [5, 6, 0, 1, 2],
        start: 18,
        end: 24,
      },
    ],
    label: 'Vie-Mar 6pm-12am',
  },
  Ronald: {
    userId: 'ronald',
    userName: 'Ronald',
    shifts: [
      {
        days: [1, 2, 3, 4, 5],
        start: 8,
        end: 16,
      },
    ],
    label: 'Lun-Vie 8am-4pm',
  },
} as const;


export function getUserSchedule(userName: string): UserSchedule | undefined {
  return USER_SCHEDULES[userName];
}


export function getAllSchedules(): UserSchedule[] {
  return Object.values(USER_SCHEDULES);
}
