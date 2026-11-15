import { AppointmentService } from '../../services/appointmentService.ts';
import type { GraphState } from '../graph.ts';
import { z } from 'zod/v4';

const SchemaAppointmentValidation = z.object({
  professionalId: z.number({
    error: (issue) =>
      issue.input === undefined
        ? "professionalId is required."
        : "professionalId must be a number.",
  }),
  patientName: z.string({
    error: (issue) =>
      issue.input === undefined
        ? "Patient name is required."
        : "Patient name must be a string.",
  }),
  datetime: z.string({
    error: (issue) =>
      issue.input === undefined
        ? "Date and time are required."
        : "Date and time must be a string.",
  }),
});

export function createSchedulerNode(appointmentService: AppointmentService) {
  return async (state: GraphState): Promise<Partial<GraphState>> => {
    console.log(`📅 Scheduling appointment...`);

    const validationResult = SchemaAppointmentValidation.safeParse(state);
    if (!validationResult.success) {
      console.log(`❌ Validation failed: ${validationResult.error}`);
      return {
        actionSuccess: false,
        actionError: validationResult.error.message,
      };
    }

    try {

      const appointment = appointmentService.bookAppointment(
        state.professionalId!,
        new Date(state.datetime!),
        state.patientName!,
        state.reason!
      );     

      console.log(`✅ Appointment scheduled successfully`);

      return {
        ...state,
        actionSuccess: true,
        appointmentData: appointment,
      };
    } catch (error) {
      console.log(`❌ Scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        ...state,
        actionSuccess: false,
        actionError: error instanceof Error ? error.message : 'Scheduling failed',
      };
    }
  };
}
