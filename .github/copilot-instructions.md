# NestJS OpenTelemetry (nestjs-otel) - AI Coding Agent Instructions

## Project Overview

This is a TypeScript library that provides OpenTelemetry integration for NestJS applications, enabling observability through metrics, tracing, and logging. The library follows NestJS module patterns and provides decorators and services for seamless OpenTelemetry integration.

## Architecture & Key Components

### Module Structure
- **Entry point**: `src/index.ts` - exports all public APIs
- **Core module**: `src/opentelemetry-core.module.ts` - handles OpenTelemetry SDK integration and DI setup
- **Public module**: `src/opentelemetry.module.ts` - provides `forRoot()` and `forRootAsync()` methods
- **Services**: `TraceService` and `MetricService` - injectable services for manual instrumentation
- **Decorators**: `@Span`, `@OtelCounter`, `@OtelMethodCounter`, etc. - declarative instrumentation

### Configuration Pattern
```typescript
// Synchronous configuration
OpenTelemetryModule.forRoot({
  metrics: {
    hostMetrics: true,
  }
})

// Asynchronous configuration with factory
OpenTelemetryModule.forRootAsync({
  useFactory: () => ({ metrics: { hostMetrics: true } }),
  inject: [ConfigService]
})
```

### Decorator Patterns
- **Span decorator**: Auto-wraps methods in OpenTelemetry spans, supports both sync/async functions
- **Metric decorators**: Parameter injection decorators (`@OtelCounter`) and method/class decorators (`@OtelMethodCounter`, `@OtelInstanceCounter`)
- **Naming convention**: Auto-generated metric names follow `app_ClassName_methodName_type_total` pattern

## Development Workflow

### Build & Test Commands
```bash
npm run build          # TypeScript compilation to /lib
npm run test          # Runs unit + e2e tests
npm run test:unit     # Jest unit tests
npm run test:e2e      # E2E tests with test applications
npm run test:coverage # Coverage report
npm run lint          # Prettier formatting check
npm run format        # Auto-format code
```

### File Structure Conventions
- **Source**: `src/` contains TypeScript source files
- **Compiled**: `lib/` contains compiled JavaScript (git-ignored, npm-published)
- **Tests**: Unit tests alongside source files (`.spec.ts`), E2E tests in `tests/e2e/`
- **Fixture app**: `tests/fixture-app/` provides test NestJS application for E2E testing

## Critical Implementation Patterns

### Decorator Implementation
When creating new decorators, follow the proxy pattern used in `@Span`:
```typescript
// Preserve function metadata and parameters for OpenAPI/reflection
propertyDescriptor.value = new Proxy(originalFunction, {
  apply: (_, thisArg, args) => wrappedFunction.apply(thisArg, args)
});
copyMetadataFromFunctionToFunction(originalFunction, propertyDescriptor.value);
```

### Metric Management
- Metrics are singleton instances managed by `metric-data.ts` using `getOrCreate*` functions
- Use the `OTEL_METER_NAME` constant for consistent meter naming
- Metrics support optional prefixes and default attributes from configuration

### Error Handling in Spans
Always record exceptions and set error status:
```typescript
span.recordException(error);
span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
```

### HTTP Adapter Detection
The library supports both Express and Fastify through `feature-detection.utils.ts`. When adding HTTP-related features, use `detectHttpAdapterType()` for adapter-specific logic.

## Dependencies & Integration Points

### Peer Dependencies
- `@opentelemetry/sdk-node` (required)
- `@opentelemetry/exporter-prometheus` (optional, for metrics)
- NestJS core packages for DI and decorators

### External Integrations
- **Prometheus**: Metrics exported via PrometheusExporter on port 8081
- **Jaeger/Tempo**: Tracing via BatchSpanProcessor
- **Pino Logging**: Structured logging with trace context injection

## Testing Strategy

### Unit Tests
- Test decorators with mock functions and verify OpenTelemetry API calls
- Test services in isolation with mocked OpenTelemetry providers
- Use `jest.mock()` for OpenTelemetry SDK components

### E2E Tests
- Create test NestJS applications in `tests/fixture-app/`
- Test module registration with both `forRoot()` and `forRootAsync()`
- Verify metrics/spans are created during actual HTTP requests
- Test adapter-specific behavior (Express vs Fastify)

## Common Patterns to Follow

1. **Export everything from index.ts** - All public APIs must be re-exported
2. **Use injection tokens** - Define constants in `opentelemetry.constants.ts`
3. **Global module pattern** - Core module is `@Global()` to avoid re-imports
4. **Async/sync support** - All decorators must handle both sync and async functions
5. **Metadata preservation** - Use `copyMetadataFromFunctionToFunction` utility
6. **Error propagation** - Decorators should not swallow errors, only record them


# Ultracite Code Standards

This project uses **Ultracite**, a zero-config Biome preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `npx ultracite fix`
- **Check for issues**: `npx ultracite check`
- **Diagnose setup**: `npx ultracite doctor`

Biome (the underlying engine) provides extremely fast Rust-based linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors

### React & JSX

- Use function components over class components
- Call hooks at the top level only, never conditionally
- Specify all dependencies in hook dependency arrays correctly
- Use the `key` prop for elements in iterables (prefer unique IDs over array indices)
- Nest children between opening and closing tags instead of passing as props
- Don't define components inside other components
- Use semantic HTML and ARIA attributes for accessibility:
  - Provide meaningful alt text for images
  - Use proper heading hierarchy
  - Add labels for form inputs
  - Include keyboard event handlers alongside mouse events
  - Use semantic elements (`<button>`, `<nav>`, etc.) instead of divs with roles

### Error Handling & Debugging

- Remove `console.log`, `debugger`, and `alert` statements from production code
- Throw `Error` objects with descriptive messages, not strings or other values
- Use `try-catch` blocks meaningfully - don't catch errors just to rethrow them
- Prefer early returns over nested conditionals for error cases

### Code Organization

- Keep functions focused and under reasonable cognitive complexity limits
- Extract complex conditions into well-named boolean variables
- Use early returns to reduce nesting
- Prefer simple conditionals over nested ternary operators
- Group related code together and separate concerns

### Security

- Add `rel="noopener"` when using `target="_blank"` on links
- Avoid `dangerouslySetInnerHTML` unless absolutely necessary
- Don't use `eval()` or assign directly to `document.cookie`
- Validate and sanitize user input

### Performance

- Avoid spread syntax in accumulators within loops
- Use top-level regex literals instead of creating them in loops
- Prefer specific imports over namespace imports
- Avoid barrel files (index files that re-export everything)
- Use proper image components (e.g., Next.js `<Image>`) over `<img>` tags

### Framework-Specific Guidance

**Next.js:**
- Use Next.js `<Image>` component for images
- Use `next/head` or App Router metadata API for head elements
- Use Server Components for async data fetching instead of async Client Components

**React 19+:**
- Use ref as a prop instead of `React.forwardRef`

**Solid/Svelte/Vue/Qwik:**
- Use `class` and `for` attributes (not `className` or `htmlFor`)

---

## Testing

- Write assertions inside `it()` or `test()` blocks
- Avoid done callbacks in async tests - use async/await instead
- Don't use `.only` or `.skip` in committed code
- Keep test suites reasonably flat - avoid excessive `describe` nesting

## When Biome Can't Help

Biome's linter will catch most issues automatically. Focus your attention on:

1. **Business logic correctness** - Biome can't validate your algorithms
2. **Meaningful naming** - Use descriptive names for functions, variables, and types
3. **Architecture decisions** - Component structure, data flow, and API design
4. **Edge cases** - Handle boundary conditions and error states
5. **User experience** - Accessibility, performance, and usability considerations
6. **Documentation** - Add comments for complex logic, but prefer self-documenting code

---

Most formatting and common issues are automatically fixed by Biome. Run `npx ultracite fix` before committing to ensure compliance.
