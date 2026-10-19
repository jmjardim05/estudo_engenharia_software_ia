import { AppointmentService } from '../../services/appointmentService.ts';
import type { GraphState } from '../graph.ts';


export function createSchedulerNode() {
  return async (state: GraphState): Promise<GraphState> => {
    console.log(`📅 Scheduling appointment...`);

    try {

      const appointmentService = new AppointmentService();
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
