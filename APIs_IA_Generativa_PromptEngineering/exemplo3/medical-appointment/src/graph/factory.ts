import { config } from '../config.ts';
import { AIService } from '../services/aiService.ts';
import { AppointmentService } from '../services/appointmentService.ts';
import { buildAppointmentGraph } from './graph.ts';

export function buildGraph() {
  const aiService = new AIService(config);
  const appointmentService = new AppointmentService();

  return buildAppointmentGraph(aiService, appointmentService);
}

export const graph = async () => {
  return buildGraph();
};

export default graph;
