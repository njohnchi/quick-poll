# 📊 Project Plan: Quick Poll

## 📌 Project Idea

A simple yet powerful voting/polling app where users can:

* Create polls with multiple options
* Share polls via a link
* Vote (restricted to one vote per user)
* View real-time results with charts

This balances feasibility with enough complexity to showcase authentication, CRUD operations, and Supabase realtime features.

---

## 🛠 Tech Stack

* **Frontend:** NuxtJS (Vue 3, Composition API)
* **Backend/Database:** Supabase (PostgreSQL + Realtime + Auth)
* **Authentication:** Supabase Auth
* **UI Components:** TailwindCSS + Shadcn UI
* **State Management:** Pinia
* **Testing:** Vitest + Testing Library
* **Charts & Visualization:** Chart.js

---

## 🤖 AI Integration Plan

### 🧱 Code or Feature Generation

* Scaffold Nuxt components (`PollForm.vue`, `PollList.vue`, `PollResults.vue`).
* Generate Supabase helper functions (`createPoll()`, `castVote()`, `getPollResults()`).
* Create Nuxt route middleware for authentication checks.

**Sample Prompt:**

> “Generate a Nuxt 3 component `PollForm.vue` with a Tailwind-styled form for creating a poll (title + options) and saving it to Supabase.”

---

### 🧪 Testing Support

* Use AI to generate **unit tests** (Vitest) for poll logic.
* Create **integration tests** to ensure one vote per user.
* Cover edge cases like polls with no options or invalid votes.

**Sample Prompt:**

> “Write Vitest tests for `castVote()` ensuring: (1) a user can vote once, (2) duplicate votes are blocked, (3) invalid poll IDs throw errors.”

---

### 📡 Schema-Aware / API-Aware Generation

* Provide Supabase schema to AI for query generation.
* Generate CRUD functions and TypeScript types directly from schema.
* Enable joins for fetching poll + options + votes in one query.

**Sample Prompt:**

> “Given the Supabase schema:

```sql
polls(id, question, created_by, created_at)  
options(id, poll_id, option_text)  
votes(id, option_id, user_id, created_at)  
```

>"Generate a Supabase function in Nuxt to fetch a poll and its options with total votes per option.

---

## 🔍 In-Editor / PR Review Tooling

* **Tool:** Cursor or CodeRabbit
* **Capabilities:**

    * Inline AI code reviews for security and optimization
    * Automatic commit message generation (Conventional Commits style)
    * PR summaries to improve collaboration clarity

---

## 📝 Prompting Strategy

### Feature Prompt

> “Generate a Nuxt page `/polls/[id].vue` that fetches a poll by ID from Supabase, displays its options, lets the user vote, and shows live-updating results using Chart.js.”

### Review Prompt

> “Review this Supabase query for optimization. Ensure it prevents duplicate votes by the same user in one poll.”

---
