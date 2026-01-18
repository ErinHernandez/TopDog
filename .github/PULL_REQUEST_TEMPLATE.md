## Description

<!-- Describe your changes in detail -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring (no functional changes)

## Testing

- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have run `npm test` and all tests pass

## Firestore Query Safety Checklist

> **CRITICAL**: All Firestore queries must be bounded to prevent server hangs.
> See [docs/firestore-best-practices.md](../docs/firestore-best-practices.md) for details.

### Required Checks

- [ ] All `getDocs(collection(...))` calls include `limit()`
- [ ] All `getDocs(query(...))` calls include `limit()`
- [ ] No N+1 query patterns (use `batchGetUserPicks` instead of loops)
- [ ] Using `playerService` for player queries (not direct collection access)
- [ ] Using `draftPicksService` for picks queries (not direct collection access)

### If Adding New Firestore Queries

- [ ] Query includes `limit()` constraint
- [ ] Query uses `withFullProtection()` wrapper for retries
- [ ] Query is wrapped with `measureQuery()` for monitoring
- [ ] Added appropriate indexes (if using compound queries)

### Performance Considerations

- [ ] Estimated max documents per query: _____ (must be < 500)
- [ ] Response time tested under load: _____ ms
- [ ] No unbounded array iterations on query results

## Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## Additional Notes

<!-- Any additional information that reviewers should know -->

---

**Pre-merge Checklist (for reviewers)**

- [ ] Code follows project style guidelines
- [ ] All Firestore queries are properly bounded
- [ ] No security vulnerabilities introduced
- [ ] Performance impact is acceptable
- [ ] Tests cover new functionality
