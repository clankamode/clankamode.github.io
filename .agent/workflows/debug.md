---
description: Systematic debugging process for diagnosing and fixing issues
---

## Steps

1. **Reproduce the issue**
   - Identify exact steps to trigger the bug
   - Note the expected vs actual behavior
   - Capture error messages, stack traces, or screenshots

2. **Isolate the cause**
   - Check recent changes (git diff)
   - Binary search through commits if needed
   - Add console.log/debugger statements strategically

3. **Form a hypothesis**
   - "The bug is caused by X because Y"
   - Test the hypothesis with a minimal change

4. **Implement the fix**
   - Make the smallest change that fixes the issue
   - Don't refactor unrelated code in the same PR

5. **Verify the fix**
   - Confirm the original issue is resolved
   - Run related tests
   - Check for regressions

6. **Document**
   - Add a comment if the fix is non-obvious
   - Update tests to prevent regression
