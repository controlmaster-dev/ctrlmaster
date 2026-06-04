import type { DiariosPriority } from "@/lib/diariosPriority";

export type OperatorDuty = {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  priority: DiariosPriority;
  isGeneral: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OperatorDutyAssignment = {
  id: string;
  dutyId: string;
  userId: string;
  sortOrder: number;
  assignedAt: string;
};

export type DiariosOperator = {
  id: string;
  name: string;
  image: string | null;
  role: string;
};

export type DiariosBoardDto = {
  operators: DiariosOperator[];
  duties: OperatorDuty[];
  assignments: OperatorDutyAssignment[];
  unassigned: OperatorDuty[];
  byOperator: Record<string, OperatorDuty[]>;
};
