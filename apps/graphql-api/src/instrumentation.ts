// apps/graphql-api/src/instrumentation.ts

console.log("--- Proof of Life: graphql-api's instrumentation.ts is being executed! ---");

import { initTelemetry } from '@noda/opentelemetry-config';
initTelemetry('graphql-api');