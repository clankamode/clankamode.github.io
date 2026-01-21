# Learning Platform (V1)

## Overview / Summary

Our goal for the year is to get 10K auth users on jamesperalta.com. To do this we need to give users a reason to login and currently there are no features hidden behind auth. The goal of this project is to create a simple, scalable, read-only learning platform with a content management admin interface.

The platform will host structured educational content across three core areas:
- Building a resume
- Data Structures & Algorithms
- System Design
- Ad-hoc Career Advice

Version 1 focuses on content delivery behind authentication and authoring, not interactivity.

## Goals & Objectives

### Primary Goal
Create a centralized platform where users can read high-quality learning material that reflects James Peralta's approach to:
- Interview preparation
- Technical mastery
- Career growth

### Secondary Goals
- Enable fast content creation and iteration via an admin UI
- Lay the groundwork for future freemium / paid expansion

### Non-Goals (V1)
The following are explicitly out of scope for the first iteration:
- Comments, likes, or discussions
- Progress tracking
- Quizzes or interactive exercises
- Payments or subscriptions (freemium is future-facing only)

## Requirements

### 1. Content Pillars
We will start with 4 content pillars:
- DSA
- Resume
- System Design
- Blog

Each content pillar can have some nesting - probably 2 levels right now.
- Topic > Topic notes (1..n)

### 2. Admin Interface
The admin UI must support:
- Creating new documents
- Editing existing documents
- Deleting documents
- Assigning documents to pillars & sections
- Rich text or markdown-based editing
- One-click save/publish
- Changes made in the admin UI must automatically propagate to all users without redeploying the site.

### 3. User Interface (Reader)
- Read-only access
- No edit controls
- Clean typography
- Fast load times
- SEO-friendly pages

### 4. Content Model (Suggested)
Each document should support:
- Title
- Section (DSA / Resume / System Design)
- Body content
- Last updated timestamp
- Optional ordering/index

## Target Users

### End Users (Readers)
- Students
- Software engineers looking to switch jobs
- Interview candidates
- YouTube audience members looking to land a job

**Permissions:**
- No login for some content
- Required login for premium content

### Admin User
Has full content creation and editing rights using the UI

**Permissions:**
- Create, edit, delete documents
- Organize content by section
- Publish changes live to users

## Success Metrics (V1)
0-1 launch.
