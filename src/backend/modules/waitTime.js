import { queues, services } from "../data/store.js";


export function estimateWaitTime(userId, serviceId) {
  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return { success: false, errors: ["Service not found."] };
  }

  const serviceQueue = queues.filter(
    (q) => q.serviceId === serviceId && q.status === "waiting"
  );

  const userEntry = serviceQueue.find((q) => q.userId === userId);
  if (!userEntry) {
    return { success: false, errors: ["User is not in this queue."] };
  }

  
  const sorted = [...serviceQueue].sort(
    (a, b) => new Date(a.joinedAt) - new Date(b.joinedAt)
  );

  const position = sorted.findIndex((q) => q.userId === userId) + 1;
  const estimatedMinutes = position * service.duration;

  return {
    success: true,
    data: {
      userId,
      serviceId,
      serviceName: service.name,
      position,
      estimatedWaitMinutes: estimatedMinutes,
      estimatedWaitLabel: `~${estimatedMinutes} min`,
    },
  };
}

export function estimateWaitTimeForQueue(serviceId) {
  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return { success: false, errors: ["Service not found."] };
  }

  const serviceQueue = queues
    .filter((q) => q.serviceId === serviceId && q.status === "waiting")
    .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));

  const estimates = serviceQueue.map((entry, index) => ({
    userId: entry.userId,
    position: index + 1,
    estimatedWaitMinutes: (index + 1) * service.duration,
    estimatedWaitLabel: `~${(index + 1) * service.duration} min`,
  }));

  return { success: true, data: estimates };
}
