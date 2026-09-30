# Engineering Principles

Apply these principles when writing or reviewing code. They are technology-agnostic — the specific libraries in this project are examples, not requirements.

---

## 1. End-to-End Type Safety

Types must flow without gaps from the data layer through the API boundary to the client. No step in the pipeline should require manual type synchronization.

- **Database → ORM**: Auto-generate type definitions from the database schema (e.g., `kysely-codegen`). Never hand-write DB types.
- **API → SDK**: Generate client SDKs from the API schema (e.g., `graphql-codegen`, `genql`). The client never constructs raw queries.
- **Shared types**: Extract domain types (enums, value shapes, IDs) into a shared package consumed by both server and client. A type change in one place propagates everywhere.

**Check**: Can you rename a field in the database and have the compiler tell you every place that breaks? If not, type safety has a gap.

---

## 2. Functional Composition Over Imperative Steps

Prefer declarative pipelines (`pipe`, `compose`, `map`, `filter`) over imperative loops and temporary variables. Each transformation should be a named, composable function.

```
// Bad: imperative
const results = []
for (const item of items) {
  const x = transform(item)
  if (x) results.push(x)
}

// Good: declarative
const results = pipe(map(transform), filter(isNotNil))(items)
```

- Use **pattern matching** (`match`/`caseOf`) instead of `if/else` chains when dispatching on type or shape. Pattern matches are exhaustive — the compiler warns when a case is missing.
- Use **`Maybe`/`Option` types** for values that may be absent instead of `null` checks scattered through the code.
- Keep functions pure. Side effects (I/O, mutations) should be isolated at the edges.

---

## 3. Runtime Validation as Defense in Depth

Static types are erased at runtime. Every external boundary (user input, API payloads, database reads, environment variables) must be validated at runtime.

- Use **assertion functions** with TypeScript `asserts` signatures: they narrow the type AND throw on invalid input.
- Use **schema validators** (e.g., Zod) at API boundaries and form inputs.
- Use **type guard functions** (`is` return types) to narrow union types in control flow.

```
// Assertion: narrows AND throws
function assertExists<T>(val: T | undefined | null, msg: string): asserts val is T

// Type guard: narrows in if-branches
const hasValue = <T>(value: T | null): value is T => value != null
```

---

## 4. Dependency Injection for Testability

Services should declare their dependencies as interfaces, not construct them. An IoC container resolves the graph at startup.

- Every service, resolver, and controller receives dependencies via injection — never via `import` of concrete implementations.
- This makes unit testing trivial: swap any dependency with a mock at the container level.
- Prefer **constructor injection** or **property injection** with decorators over service locators.

---

## 5. Transaction-Based Test Isolation

Tests must not pollute each other. Every test that touches the database should:

1. `BEGIN` a transaction
2. Execute the test
3. `ROLLBACK` the transaction

This gives each test a fresh database state without expensive setup/teardown. Wrap this in a test helper (`withDatabase`) so every test is automatically isolated.

- Use **test containers** (ephemeral databases in Docker) for integration tests.
- Mock external services (S3, email) at the SDK client level.
- Tests should run in parallel safely because each has its own transaction.

---

## 6. Schema as Single Source of Truth

Define the schema once. Generate everything else from it.

- **GraphQL schema** → generates TypeScript SDK, types, and documentation.
- **Database schema** → generates ORM types, migration diffs.
- **Validation schema** (Zod) → generates TypeScript types via `z.infer`, used in both server validation and client forms.

When the schema is the source, you cannot have a mismatch between what the API promises and what the client expects.

---

## 7. Proxy / Metaprogramming to Eliminate Boilerplate

When you have a repetitive pattern (unwrapping API responses, wiring subscriptions, mapping method calls), use metaprogramming to eliminate it once.

- JavaScript `Proxy` can intercept property access to auto-transform results (e.g., unwrap the first property of every GraphQL response).
- Code generators can produce SDK methods from schema definitions.
- Decorators can add cross-cutting concerns (error handling, logging, auth) without modifying business logic.

The goal: business code should contain only business logic. Infrastructure concerns are injected or generated.

---

## 8. Assertion Functions as Type Narrowers

Use TypeScript's `asserts` and `is` return types to create functions that both validate and narrow:

```
// Throws if val is null, narrows type after call
assertExists(val, 'val must exist')

// Returns boolean, narrows type in if-branch
if (isStringType(value)) { /* value is StringType here */ }
```

This replaces unsafe type casts and `!` non-null assertions with compiler-verified safety.

---

## 9. Composable Error Handling in Pipelines

Errors should be first-class values in functional pipelines, not exceptions that break the flow.

- **`rethrow`**: A tagged template literal that wraps errors with context: `rethrow\`Failed to fetch node: ${error}\``
- **`failOn(predicate, message)`**: Chains onto a promise to assert a condition, throwing with context if it fails.
- **Error decorators**: Wrap methods with try/catch + custom handler without modifying the method body.

Avoid bare `try/catch` blocks in business logic. Push error handling to pipeline boundaries.

---

## 10. Monorepo with Shared Types

Structure the project as a monorepo with at minimum:

- `backend/` — server code
- `frontend/` — client code
- `shared/` — types, utilities, and validation shared across both

The shared package should be lean: only types, pure functions, and validation. No framework-specific code. Changes to shared types automatically propagate to both server and client through the compiler.

---

## 11. Strict Compiler + Automated Quality Gates

Configure the compiler and linter to reject patterns that lead to bugs:

**TypeScript** (`tsconfig.json`):
- `strict: true`
- `strictNullChecks: true`
- `noImplicitReturns: true`
- `noUnusedLocals: true` / linter equivalent

**Linter** (e.g., Biome, ESLint):
- `noUnusedImports: error` — dead imports hide intent
- `useImportType: error` — distinguish type-only imports
- `useArrowFunction: error` — prefer lexical `this`
- Auto-organize imports on save

**Never relax `strictNullChecks`**. If the compiler complains about null, fix the code, not the config.

---

## 12. Reactive State Over Imperative State

For UI state, use reactive primitives (signals, observables) instead of imperative state + manual subscription:

- State changes automatically propagate to consumers without `setState` or manual event wiring.
- Computed/derived state is declared once and stays in sync.
- Side effects are explicitly subscribed and can be cleaned up.

This is the same principle as functional composition: declare what, not how.

---

## 13. Exhaustive Pattern Matching

When dispatching on a union type or enum, use pattern matching that requires all cases to be handled:

```
const fieldForNode = match(
  caseOf([{ type: NodeType.list }], resolveList),
  caseOf([{ type: NodeType.object }], resolveObj),
  caseOf([_], resolveValue)  // default case
)
```

If a new variant is added to the enum, the compiler/linter should flag every `match` that doesn't handle it. This prevents "forgot to handle the new case" bugs.

---

## 14. Generator Functions for Tree/Graph Traversal

For recursive data structures (trees, graphs), use generator functions (`function*`) for traversal:

```
function* allNodes(node: TreeNode): Generator<TreeNode> {
  yield node
  for (const child of node.nodes) {
    yield* allNodes(child)
  }
}
```

Generators are lazy, composable, and can be filtered/mapped with standard iterators. They avoid stack overflow for deep structures when combined with iterative algorithms.

---

## 15. Dynamic Schema Generation

When the API shape depends on user-defined data (CMS, form builders, config-driven apps), generate the schema at runtime from the domain model rather than hard-coding it:

- Each domain entity maps to a schema type.
- Filters, ordering, and pagination are generated per entity.
- Cache the generated schema and invalidate on domain changes.

This decouples the API surface from code changes — users can define new content types without a deploy.

---

## Application Checklist

Before submitting code, verify:

- [ ] Types flow from DB through API to client with no manual synchronization
- [ ] External inputs are validated at runtime, not just typed
- [ ] No `as any` or `!` non-null assertions — use assertion functions instead
- [ ] Business logic is pure functions composed in pipelines
- [ ] Pattern matches handle all cases (or have an explicit default)
- [ ] Tests use transaction isolation and run in parallel safely
- [ ] Dependencies are injected, not imported as concrete implementations
- [ ] No unused imports or dead code
- [ ] Shared types live in the shared package, not duplicated
- [ ] Error handling composes in pipelines, not as scattered try/catch
