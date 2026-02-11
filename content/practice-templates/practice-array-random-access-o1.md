---
title: "Practice: O(1) Random Access"
concept: "array.random-access-o1"
estMinutes: 5
---

## Problem

Your teammate claims "arrays have O(1) access because they're fast." This is technically correct but misses the *why*.

Explain the mechanism that enables O(1) random access in arrays:
1. How does the CPU calculate the memory address of `arr[i]`?
2. Why doesn't this calculation depend on the size of the array?
3. Why can't linked lists achieve O(1) access using the same technique?

## Expected Behavior

A precise explanation of pointer arithmetic and why it requires contiguous, fixed-size elements.

## Solution

**1. Address Calculation (Pointer Arithmetic)**
```
address(arr[i]) = base_address + (i × element_size)
```

If `arr` starts at address `0x1000` and each element is 8 bytes:
- `arr[0]` → `0x1000 + (0 × 8)` = `0x1000`
- `arr[5]` → `0x1000 + (5 × 8)` = `0x1028`
- `arr[999]` → `0x1000 + (999 × 8)` = `0x2F78`

**2. Size Independence**
The formula has no loop, no traversal. It's a single multiplication and addition—constant time regardless of whether the array has 10 or 10 million elements.

**3. Why Linked Lists Can't Do This**
Linked lists don't have:
- **Contiguous memory**: Nodes are scattered; you can't calculate positions
- **Fixed-size gaps**: Each node could be anywhere in memory

To find the 5th element, you must follow 5 pointers: `head → node1 → node2 → node3 → node4 → node5`. That's O(n).

```typescript
// Array: O(1) - direct calculation
const value = arr[1000]; // One memory access

// Linked List: O(n) - sequential traversal
let node = head;
for (let i = 0; i < 1000; i++) {
  node = node.next; // 1000 memory accesses
}
const value = node.value;
```

## Key Insight

O(1) array access comes from pointer arithmetic: `base + (index × size)`. This only works because arrays guarantee contiguous memory and fixed element sizes.
