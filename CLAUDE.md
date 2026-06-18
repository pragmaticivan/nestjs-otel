# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`nestjs-otel` — NestJS module wrapping OpenTelemetry (`@opentelemetry/api`). Published library (`main: lib/index.js`). Provides tracing, metrics, and wide-events to NestJS apps. Node >= 22. NestJS 11 peer dep.

The library does **not** start the OTEL SDK. Consumers create their own `NodeSDK` (`tracing.ts`) and call `otelSDK.start()` before `NestFactory.create`. This module reads the global tracer/meter providers the SDK registers (`trace.getTracer`, `metrics.getMeterProvider`).

## Commands

```bash
npm run build         # tsc → lib/ (prebuild rimraf's lib first)
npm run lint          # ultracite check (biome wrapper)
npm run format        # ultracite fix (auto-fix lint)
npm test              # unit + e2e
npm run test:unit     # jest, *.spec.ts under src/
npm run test:e2e      # jest tests/jest-e2e.json, --runInBand
npm run test:coverage
npm run test:watch
```

Run a single test: `npx jest src/wide-events/wide-event.service.spec.ts` (or `-t "<test name>"`). E2E single: `npx jest --config ./tests/jest-e2e.json tests/e2e/<file>.e2e-spec.ts`.

Unit specs live next to source under `src/`. E2E specs in `tests/e2e/` run against `tests/fixture-app/` (a real NestJS app). Commits use Conventional Commits (commitlint + husky). `lint-staged` runs `ultracite fix` on staged files.

## Architecture

`OpenTelemetryModule.forRoot(options)` / `forRootAsync(options)` (`src/opentelemetry.module.ts`) are thin shells delegating to `OpenTelemetryCoreModule` (`src/opentelemetry-core.module.ts`). The core module is `@Global`, registers + exports `TraceService`, `MetricService`, `WideEventService`, `WideEventInterceptor`, and the `OPENTELEMETRY_MODULE_OPTIONS` token. `onApplicationBootstrap` is the only runtime side effect — it starts `HostMetrics` when `options.metrics.hostMetrics` is true. `forRootAsync` supports `useFactory` / `useClass` / `useExisting` via `OpenTelemetryOptionsFactory`.

Three feature areas, each exported through `src/index.ts`:

- **tracing** (`src/tracing/`): `TraceService` is a thin accessor over the global tracer. The real work is in decorators (`src/tracing/decorators/`): `@Span(name?, options?)` wraps a method in `startActiveSpan`, handles sync + Promise returns, records exceptions, supports an `onResult` callback to set attributes from the return value. `@Traceable` applies `@Span` to every method of a class. `@Baggage` / `@CurrentSpan` are param decorators. Decorators preserve the original function name/metadata via a `Proxy` + `copyMetadataFromFunctionToFunction` (`src/opentelemetry.utils.ts`) — critical so OpenAPI/Nest reflection still works.

- **metrics** (`src/metrics/`): `MetricService` exposes `getCounter`/`getHistogram`/`getGauge`/observable variants, all delegating to `getOrCreate*` in `src/metrics/metric-data.ts`, which caches instruments by name in a module-level map (idempotent re-fetch). `@InjectMetric(name)` (`src/metrics/injector.ts`) injects a named instrument via a DI token from `getToken`. Class/method decorators in `src/metrics/decorators/` (`OtelInstanceCounter`, `OtelMethodCounter`, etc.) auto-instrument.

- **wide-events** (`src/wide-events/`): one structured event (a wide span) per request. `WideEventInterceptor` opens a `WideEventBag` (a `Map`) stored on the active OTEL context under `WIDE_EVENT_CONTEXT_KEY`, then on `finalize` flushes all accumulated attributes onto the span that was active when the request entered. `WideEventService` (`set`/`setMany`/`increment`/`startTimer`) and the `@WideEventField` decorator mutate that bag via `getWideEventBag()` — all **no-ops outside an intercepted request**. The interceptor seeds `code.function.name` plus an optional `options.wideEvents.seed(executionContext)`, and records `error.type`/`error.message` on failure. Register globally with `APP_INTERCEPTOR` or per-controller with `@UseInterceptors`.

Options/interfaces in `src/interfaces/`. Constants (token, tracer name `OTEL_TRACER_NAME`) in `src/opentelemetry.constants.ts`.

## Conventions

- Lint is `ultracite` (extends biome). Config in `biome.jsonc` already disables `noExplicitAny`, `useAwait`, barrel-file warnings — `any` is used freely in decorator code by design. Run `npm run format` before committing.
- Public API symbols are tagged `@publicApi`; internal ones `@internal`. Keep new exports wired through `src/index.ts`.
- Decorators must not break function identity — when adding/altering a method decorator, preserve name + metadata as the existing ones do.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
