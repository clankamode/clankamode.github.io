-- Fix: Convert TypeScript starter code to Python and add fnCall to test_cases
-- Affects 10 questions that had TS starter code and/or missing fnCall in test_cases

-- Two Sum
UPDATE "InterviewQuestions" SET
  starter_code = E'def two_sum(nums: list[int], target: int) -> list[int]:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"nums=[2,7,11,15], target=9","fnCall":"two_sum([2, 7, 11, 15], 9)","expected":"[0, 1]","expectedOutput":"[0, 1]"},{"id":2,"label":"Test 2","input":"nums=[3,2,4], target=6","fnCall":"two_sum([3, 2, 4], 6)","expected":"[1, 2]","expectedOutput":"[1, 2]"},{"id":3,"label":"Test 3","input":"nums=[3,3], target=6","fnCall":"two_sum([3, 3], 6)","expected":"[0, 1]","expectedOutput":"[0, 1]"}]'::jsonb
WHERE id = 'f6b901eb-b5de-5899-8b2d-20e88dacdd1d';

-- Valid Anagram
UPDATE "InterviewQuestions" SET
  starter_code = E'def is_anagram(s: str, t: str) -> bool:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"s=\"anagram\", t=\"nagaram\"","fnCall":"is_anagram(\"anagram\", \"nagaram\")","expected":"True","expectedOutput":"True"},{"id":2,"label":"Test 2","input":"s=\"rat\", t=\"car\"","fnCall":"is_anagram(\"rat\", \"car\")","expected":"False","expectedOutput":"False"},{"id":3,"label":"Test 3","input":"s=\"a\", t=\"a\"","fnCall":"is_anagram(\"a\", \"a\")","expected":"True","expectedOutput":"True"}]'::jsonb
WHERE id = '46214ecc-a201-59ad-a292-da6d9798959b';

-- Contains Duplicate
UPDATE "InterviewQuestions" SET
  starter_code = E'def contains_duplicate(nums: list[int]) -> bool:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"nums=[1,2,3,1]","fnCall":"contains_duplicate([1, 2, 3, 1])","expected":"True","expectedOutput":"True"},{"id":2,"label":"Test 2","input":"nums=[1,2,3,4]","fnCall":"contains_duplicate([1, 2, 3, 4])","expected":"False","expectedOutput":"False"},{"id":3,"label":"Test 3","input":"nums=[1,1,1,3,3,4,3,2,4,2]","fnCall":"contains_duplicate([1, 1, 1, 3, 3, 4, 3, 2, 4, 2])","expected":"True","expectedOutput":"True"}]'::jsonb
WHERE id = '06133161-34cb-5b7e-ab76-dd9e9a2be5f5';

-- Best Time to Buy and Sell Stock
UPDATE "InterviewQuestions" SET
  starter_code = E'def max_profit(prices: list[int]) -> int:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"prices=[7,1,5,3,6,4]","fnCall":"max_profit([7, 1, 5, 3, 6, 4])","expected":"5","expectedOutput":"5"},{"id":2,"label":"Test 2","input":"prices=[7,6,4,3,1]","fnCall":"max_profit([7, 6, 4, 3, 1])","expected":"0","expectedOutput":"0"}]'::jsonb
WHERE id = 'a5c3192f-49ca-5e70-bdf6-e5e36c04de4c';

-- Binary Search
UPDATE "InterviewQuestions" SET
  starter_code = E'def search(nums: list[int], target: int) -> int:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"nums=[-1,0,3,5,9,12], target=9","fnCall":"search([-1, 0, 3, 5, 9, 12], 9)","expected":"4","expectedOutput":"4"},{"id":2,"label":"Test 2","input":"nums=[-1,0,3,5,9,12], target=2","fnCall":"search([-1, 0, 3, 5, 9, 12], 2)","expected":"-1","expectedOutput":"-1"}]'::jsonb
WHERE id = '09fc40df-4b89-5e7b-95a1-e6ebb696bfdf';

-- Climbing Stairs
UPDATE "InterviewQuestions" SET
  starter_code = E'def climb_stairs(n: int) -> int:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"n=2","fnCall":"climb_stairs(2)","expected":"2","expectedOutput":"2"},{"id":2,"label":"Test 2","input":"n=3","fnCall":"climb_stairs(3)","expected":"3","expectedOutput":"3"},{"id":3,"label":"Test 3","input":"n=5","fnCall":"climb_stairs(5)","expected":"8","expectedOutput":"8"}]'::jsonb
WHERE id = '4f2d2679-48da-5bbb-8ea2-19fe5da3d5c1';

-- Maximum Subarray
UPDATE "InterviewQuestions" SET
  starter_code = E'def max_sub_array(nums: list[int]) -> int:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"nums=[-2,1,-3,4,-1,2,1,-5,4]","fnCall":"max_sub_array([-2, 1, -3, 4, -1, 2, 1, -5, 4])","expected":"6","expectedOutput":"6"},{"id":2,"label":"Test 2","input":"nums=[1]","fnCall":"max_sub_array([1])","expected":"1","expectedOutput":"1"},{"id":3,"label":"Test 3","input":"nums=[5,4,-1,7,8]","fnCall":"max_sub_array([5, 4, -1, 7, 8])","expected":"23","expectedOutput":"23"}]'::jsonb
WHERE id = 'e7ea5536-07ea-5c47-9261-a2d9a0936aa5';

-- Number of Islands
UPDATE "InterviewQuestions" SET
  starter_code = E'def num_islands(grid: list[list[str]]) -> int:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"4x5 grid with 1 island","fnCall":"num_islands([[\"1\",\"1\",\"1\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"1\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"0\",\"0\"]])","expected":"1","expectedOutput":"1"},{"id":2,"label":"Test 2","input":"4x5 grid with 3 islands","fnCall":"num_islands([[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"1\",\"1\",\"0\",\"0\",\"0\"],[\"0\",\"0\",\"1\",\"0\",\"0\"],[\"0\",\"0\",\"0\",\"1\",\"1\"]])","expected":"3","expectedOutput":"3"}]'::jsonb
WHERE id = 'd5e04cbe-1a27-5aed-b1a2-6dc3cab6d2c4';

-- Valid Parentheses
UPDATE "InterviewQuestions" SET
  starter_code = E'def is_valid(s: str) -> bool:\n    pass',
  test_cases = '[{"id":1,"label":"Test 1","input":"s=\"()\"","fnCall":"is_valid(\"()\")","expected":"True","expectedOutput":"True"},{"id":2,"label":"Test 2","input":"s=\"()[]{}\"","fnCall":"is_valid(\"()[]{}\")","expected":"True","expectedOutput":"True"},{"id":3,"label":"Test 3","input":"s=\"(]\"","fnCall":"is_valid(\"(]\")","expected":"False","expectedOutput":"False"}]'::jsonb
WHERE id = '64822c8c-b866-5494-9424-081dd1a29659';

-- Reverse Linked List (needs Python class + starter code)
UPDATE "InterviewQuestions" SET
  starter_code = E'def reverse_list(head):\n    pass',
  helper_code = E'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next\n\ndef list_to_linked(arr):\n    dummy = ListNode(0)\n    curr = dummy\n    for v in arr:\n        curr.next = ListNode(v)\n        curr = curr.next\n    return dummy.next\n\ndef linked_to_list(node):\n    result = []\n    while node:\n        result.append(node.val)\n        node = node.next\n    return result\n',
  test_cases = '[{"id":1,"label":"Test 1","input":"head=[1,2,3,4,5]","fnCall":"linked_to_list(reverse_list(list_to_linked([1,2,3,4,5])))","expected":"[5, 4, 3, 2, 1]","expectedOutput":"[5, 4, 3, 2, 1]"},{"id":2,"label":"Test 2","input":"head=[1,2]","fnCall":"linked_to_list(reverse_list(list_to_linked([1,2])))","expected":"[2, 1]","expectedOutput":"[2, 1]"},{"id":3,"label":"Test 3","input":"head=[]","fnCall":"linked_to_list(reverse_list(list_to_linked([])))","expected":"[]","expectedOutput":"[]"}]'::jsonb
WHERE id = '6819b7b2-2c8c-5dae-91c2-381c809431e2';
