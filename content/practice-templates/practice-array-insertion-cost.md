---
title: "Practice: Array Insertion Cost"
concept: "array.insertion-cost"
estMinutes: 5
---

## Problem

You need to maintain a sorted list of user IDs. A junior developer suggests using an array and inserting new IDs in sorted order.

Analyze this approach:
1. What is the time complexity of inserting into a sorted array?
2. Why is the complexity O(n) even if you use binary search to find the insertion point?
3. When is this approach still acceptable despite the O(n) cost?

## Expected Behavior

A clear breakdown of the two phases (find + shift) and when the tradeoff makes sense.

## Solution

**1. Insertion Complexity: O(n)**
Inserting into a sorted array has two phases:
- **Find position**: O(log n) with binary search
- **Shift elements**: O(n) to make room

The shift dominates → O(n) overall.

**2. Why Binary Search Doesn't Help**
Binary search finds WHERE to insert in O(log n). But arrays are contiguous—you can't just "make space." Every element after the insertion point must move one position right.

```typescript
// Insert 25 into [10, 20, 30, 40, 50]
// Step 1: Binary search finds index 2 → O(log n)
// Step 2: Shift [30, 40, 50] right → O(n)
// Result: [10, 20, 25, 30, 40, 50]

function insertSorted(arr: number[], value: number): void {
  // Find insertion point
  let i = arr.length;
  while (i > 0 && arr[i - 1] > value) {
    arr[i] = arr[i - 1]; // Shift right
    i--;
  }
  arr[i] = value;
}
```

**3. When O(n) Insertion is Acceptable**
- **Small arrays**: O(n) on 100 elements is negligible
- **Read-heavy workloads**: If you search 1000× per insert, O(log n) search wins
- **Batch inserts**: Insert many, then sort once → amortized cost
- **Memory constraints**: Arrays use less memory than trees/heaps

| Operation | Sorted Array | BST | Heap |
|-----------|--------------|-----|------|
| Insert | O(n) | O(log n) | O(log n) |
| Search | O(log n) | O(log n) | O(n) |
| Min/Max | O(1) | O(log n) | O(1) |

## Key Insight

Array insertion is O(n) because contiguous memory requires shifting. Binary search only optimizes the "find" phase—you still pay O(n) to make room.
