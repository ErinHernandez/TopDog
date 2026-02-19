# Scrolling Debug Analysis

## Investigation Plan

### Step 1: Understand the Hierarchy
1. **Non-Draft Room Subs**: Regular app subheaders (exposure, my-teams, etc.)
2. **Draft Room Subs**: Draft-specific subheaders (roster, board, info tabs)

### Step 2: Determine Relationship
- Are they parent-child related?
- Do they share CSS classes/styles?
- Is one "in charge" of the other?
- One-way or two-way influence?

### Step 3: Test Isolation
- Test each sub independently
- Identify which breaks first
- Find the root cause

## Questions to Answer
1. Which sub should we start with - inside or outside draft room?
2. Are the subs affecting each other in a one-way manner?
3. Is one "in charge" of the other?
4. What's the CSS inheritance chain?

## Test Cases
- [ ] Non-draft room scrolling (exposure, my-teams)
- [ ] Draft room roster tab scrolling
- [ ] Draft room board tab scrolling  
- [ ] Draft room info tab scrolling
- [ ] Cross-contamination testing
