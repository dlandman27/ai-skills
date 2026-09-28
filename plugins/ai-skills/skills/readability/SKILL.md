---
name: readability
description: Use when reviewing, refactoring, or writing logic-heavy code — applies readability tactics around conditional flattening, named boolean variables, branch collapsing, single state ownership, and avoiding explanatory comments.
---

# Readability

## Flatten nested conditionals into early returns

Invert each failure or edge case into an early return so they stack vertically at the top. The happy path sits at the bottom, unindented. Never nest a second `if` inside a first when an early return would do.

```ts
// Good
if (!authTokenCache.token) {
  return requestAuthToken(user, false);
}
if (isTokenExpired(authTokenCache.token)) {
  return requestAuthToken(user, true);
}
return authTokenCache.token;

// Bad
if (authTokenCache.token) {
  if (isTokenExpired(authTokenCache.token)) {
    return requestAuthToken(user, true);
  }
  return authTokenCache.token;
}
return requestAuthToken(user, false);
```

## Extract named local variables for complex boolean expressions

When a boolean expression is used more than once, or its meaning is not immediately obvious inline, extract it into a named `const`. The name should state what is true, not how it is computed.

```ts
// Good
const hasExpiredToken = authTokenCache.token !== null && isTokenExpired(authTokenCache.token);
if (!authTokenCache.token || hasExpiredToken) {
  return requestAuthToken(user, hasExpiredToken);
}

// Bad
if (!authTokenCache.token || (authTokenCache.token !== null && isTokenExpired(authTokenCache.token))) {
  return requestAuthToken(user, authTokenCache.token !== null && isTokenExpired(authTokenCache.token));
}
```

## Collapse near-identical branches

When two branches differ only in one argument or value, collapse them into one by extracting the differing part into a variable. The branch disappears; the variable carries the meaning.

```ts
// Good
const hasExpiredToken = authTokenCache.token !== null && isTokenExpired(authTokenCache.token);
if (!authTokenCache.token || hasExpiredToken) {
  return requestAuthToken(user, hasExpiredToken);
}

// Bad — two branches that differ only in the forceRefresh argument
if (!authTokenCache.token) {
  return requestAuthToken(user, false);
}
if (isTokenExpired(authTokenCache.token)) {
  return requestAuthToken(user, true);
}
```

## Consolidate state mutations to a single owner

Each piece of state should be written in exactly one place. If the same assignment appears across multiple functions, move it to the single function that is always called on that path — it becomes the authoritative owner. Scattered writes are a bug surface.

```ts
// Good — userId is set once, at the top of requestAuthToken
const requestAuthToken = async (user, forceRefresh) => {
  authTokenCache.userId = user.uid;
  // ...
};

// Bad — userId set independently in getAuthIdToken, subscribeToAuthTokenChanges, and requestAuthToken
```

## Comments explaining code are a smell

If you feel the need to write a comment explaining what a block of code does, that is a signal to refactor — better names, extracted variables, or flatter structure can usually make the comment unnecessary. Only write a comment when the **why** is non-obvious and cannot be encoded in the code itself.
