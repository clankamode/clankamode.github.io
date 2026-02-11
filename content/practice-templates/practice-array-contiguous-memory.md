---
title: "Practice: Contiguous Memory"
concept: "array.contiguous-memory"
estMinutes: 5
---

## Problem

You're debugging a performance issue. A colleague suggests replacing an array with a linked list for "better insertion performance."

Given this context, explain:
1. What does "contiguous memory" mean for arrays?
2. Why does contiguous memory matter for CPU cache performance?
3. When would you still prefer an array over a linked list despite O(n) insertion?

## Expected Behavior

A clear explanation covering memory layout, cache locality, and the tradeoff between insertion cost and access patterns.

## Solution

**1. Contiguous Memory**
Arrays store elements in adjacent memory addresses. If `arr[0]` is at address `0x1000` and each element is 4 bytes, then `arr[1]` is at `0x1004`, `arr[2]` at `0x1008`, etc.

**2. Cache Performance**
Modern CPUs load memory in chunks called "cache lines" (typically 64 bytes). When you access `arr[0]`, the CPU also loads nearby elements into L1 cache. Sequential iteration through an array hits cache almost every time.

Linked lists scatter nodes across memory. Each access is a potential cache miss → orders of magnitude slower for iteration.

**3. When Arrays Win**
- Read-heavy workloads (iteration, search, random access)
- Small-to-medium sizes where O(n) insertion is negligible
- When you need O(1) index access

Linked lists only win when you're doing frequent insertions/deletions at known positions AND rarely iterating.

```typescript
// Cache-friendly: sequential access
let sum = 0;
for (let i = 0; i < arr.length; i++) {
  sum += arr[i]; // Each access likely a cache hit
}

// Cache-unfriendly: pointer chasing
let node = head;
while (node) {
  sum += node.value; // Each access likely a cache miss
  node = node.next;
}
```

## Key Insight

Arrays are cache-friendly by default. The "O(n) insertion" cost is often irrelevant compared to the orders-of-magnitude performance gain from cache locality during iteration.
