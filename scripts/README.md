# Scripts Directory

This directory contains utility scripts and one-off tasks for the project.

## Structure

- `src/` - TypeScript/JavaScript source files
- `bin/` - Executable shell scripts
- `data/` - Data files used by scripts

## Available Scripts

### Practice Test Data Migration

#### 1. `grade_all_sessions.ts` - Grade TestAnswer Records
Backfills the `is_correct` field for all TestAnswer records that haven't been graded yet.

**Usage:**
```bash
npm run grade_sessions
```

**What it does:**
- Finds all TestAnswer rows where `is_correct` is `null`
- Fetches correct answers from QuestionBank
- Compares user answers with correct answers
- Batch updates records with `is_correct: true/false`

**When to use:**
- After deploying grading changes to backfill existing data
- If grading fails and needs to be re-run
- For data migration or import scenarios

#### 2. `update_test_sessions.ts` - Complete TestSession Records
Updates TestSession records with completion data based on their TestAnswer records.

**Usage:**
```bash
npm run update_sessions
```

**What it does:**
- Finds incomplete TestSession records (where `completed_at` is `null`)
- Counts correct/incorrect answers from TestAnswer records
- Calculates score percentage
- Updates session with `completed_at`, `correct_answers`, and `score_percentage`

**Requirements:**
- TestAnswer records must already be graded (run `grade_sessions` first)

**When to use:**
- After running `grade_sessions` to complete the backfill
- To mark abandoned sessions as complete if they have all answers
- For data cleanup and migration

#### Migration Order

If you need to backfill both TestAnswer and TestSession data:

```bash
# Step 1: Grade all answers first
npm run grade_sessions

# Step 2: Update session completion data
npm run update_sessions
```

### Other Scripts

#### `get_video_data.ts` - Fetch Video Data
Retrieves video metadata from external sources.

**Usage:**
```bash
npm run get_video_data
```

## Running Scripts

TypeScript/JavaScript scripts can be run using:
```bash
# For TypeScript scripts
npx tsx scripts/src/your-script.ts

# For JavaScript scripts
node scripts/src/your-script.js
```

Shell scripts can be run directly:
```bash
./scripts/bin/your-script.sh
```
