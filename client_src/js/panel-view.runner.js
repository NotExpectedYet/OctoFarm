import { createClientSSEWorker } from "./lib/client-worker";
import { setViewType } from "./monitoring/monitoring-view.state";
import {
  monitoringSSEventHandler,
  monitoringWorkerURL
} from "./monitoring/monitoring-sse.handler";

const viewType = "panel";

setViewType(viewType);
createClientSSEWorker(monitoringWorkerURL, monitoringSSEventHandler);
