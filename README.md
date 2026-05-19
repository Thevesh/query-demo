# Civic participation | SG Election Explorer

*Live demo: [omedpgo.thevesh.com/](https://omedpgo.thevesh.com/) · Data sourced from [data.gov.sg](https://data.gov.sg/datasets?agencies=Elections+Department+(ELD)&resultId=1531)*

## Problem Statement

Singapore's election data is technically public, since the Elections Department publishes results after every General Election. [data.gov.sg](https://elections.data.gov.sg/en) has done great work making this data more accesible—but this can be improved!

**The main problem: Public data that is not usable by non-technical citizens.** A downloadable CSV file containing raw data is not the same as data you can query. Converting raw election results into a usable format—cleaning, normalising, generating meaningful derived fields, and storing it in a queryable structure—requires non-trivial engineering work. Most citizens never get past the first download.

Three specific failure modes make this worse:

**1. Intelligent non-coders are underserved.** Political curiosity is not correlated with SQL proficiency. A voter with questions can read a journalist's take, or trust their intuition. They cannot interrogate the data themselves.

**2. Data-savvy users face pipeline friction.** Analysts and journalists who *could* query the data still spend hours building and maintaining ETL pipelines before they write a single query.

**3. Pure AI for data analysis is hallucination-prone.** Dumping the CSV into ChatGPT often fails because LLMs confidently fabricate specific vote counts, candidate names, and other details. The worst part is that these errors are essentially undetectable unless you already have superhuman memory of the exact data.

## Features & Prioritisation

| Priority | Feature | Description |
|---|---|---|
| P0 | AI-assisted query generation | A pre-built prompt gives any LLM the schema and context needed to convert a plain-English question into valid SQL. The AI never touches the actual data, so we can be confident in the output. |
| P0 | In-browser SQL execution (DuckDB WASM) | Queries run entirely client-side—no backend, no queue, no cost per run. |
| P1 | Curated sample queries | Ten pre-written questions covering seats, parties, and candidates—onboarding for casual users and a quality signal for what the data can answer. |
| P1 | Shareable encoded URLs | A query is fully encoded in the URL—no login, no storage. Turns individual analysis into civic conversation: a journalist can share a query, a teacher can assign one, a voter can fact-check a claim. |
| P2 | CSV export and short links | Output-stage friction reduction. Both require no architectural changes. |

Features deliberately not built: user accounts, saved queries, visualisation charts, commenting. These add complexity without meaningfully expanding the audience at this stage.



## Implementation

**Stack:**
- **DuckDB WASM**: Columnar analytics engine in the browser. Eliminates the query execution backend entirely.
- **Parquet on CDN**: Pre-processed datasets served as Parquet. DuckDB reads only touched columns via HTTP range requests.
- **CodeMirror**: SQL editor with syntax highlighting.
- **Next.js + Vercel**: Chosen for familiarity; swappable with vanilla HTML/JS.

**Wishlist (deferred for parsimony):**
- Cloudflare Turnstile: bot protection on the short-link endpoint; invisible to real users, free at reasonable volume.
- GoGovSG short-link integration: stubbed in the current demo.
- Automated Parquet pipeline: files are currently built and uploaded manually; a lightweight pipeline would validate, regenerate, and push on each data release.
- ClickHouse for usage analytics.

**Constraints and trade-offs considered:**

1.  *Bring-your-own-AI vs. embedded AI.* The most obvious alternative to the copy-prompt approach is to embed an AI directly in the product—the user types a question, the product calls an LLM API, and SQL appears automatically. I deliberately rejected this approach to manage costs (LLM calls are expensive + election products can go viral overnight), ensure privacy, and avoid provider lock-in (in particular, being prone to downtime of a 3rd party).

2. *DuckDB (client-side) vs. API (server-side).* The alternative to running DuckDB in the browser is a server that accepts queries and returns results. That approach has a marginal cost for every query run, or a fixed infra cost. Client-side DuckDB is distributed computing in the most literal sense. The trade-off is a ~5MB WASM bundle on first load, adding a few seconds of cold-start latency. This is mitigated by loading the bundle lazily after the page renders.

3. *Expose vs. hide the SQL.* A natural instinct is to hide the SQL entirely—show a text box, return a table, abstract away the mechanics. I chose not to. Showing the SQL serves two purposes. First, transparency: a user can see exactly what computation produced the result they're looking at. Second, education: many Singaporeans are capable of learning or at least understanding SQL if given a working example and gentle exposure.


## Launch & Rollout

**Phase 1: Soft launch (anytime, against historical data).** The product can go live at any point. Historical data going back to 1955 is already rich enough to be genuinely interesting.

**Phase 2: Stress test and feedback.** A small group of journalists, academics, and experts are invited to push the product hard: run unusual queries, probe edge cases, and tell us what questions the data can't yet answer.

**Phase 3: All-out promotion from Parliament dissolution onward.** When Parliament is dissolved, the ~month-long campaign period that follows is when civic curiosity peaks. This is the window for concentrated promotion: social posts, journalist outreach, shareable query links on timely questions.

**Ongoing**: Monitor query failure rates and activation. Expand the dataset scope based on what users are actually trying to ask—boundary data, nomination information, by-election history.


## Measuring Success

| Metric | What it signals |
|---|---|
| **Activation rate** (% of sessions with ≥1 query run) | Whether users hit an intimidation wall |
| **Query diversity** (unique encoded URLs / total runs) | Genuine exploration vs. sample query clicks |
| **Share link generation** | Perceived value; shares are the primary distribution mechanism |
| **Downstream citations** (press, papers, social) | Qualitative but high-signal reach |
| **Off-season return visits** | Whether the tool has lasting utility beyond election day |

What I would not optimise for: raw pageviews (inflated by press coverage with zero retention) and time-on-site (a fast, efficient query is better than a slow, engaging one).


## Long-term Vision

The immediate product is an election data explorer. The long-term vision is a civic data layer for Singapore.

Elections are one dataset. The same architecture—pre-processed Parquet files, DuckDB WASM, AI-assisted query generation, shareable URLs—applies everything else on data.gov.sg.

The deeper shift is epistemic. A civic data layer makes it possible for any Singaporean—not just those with data engineering skills or institutional resources—to interrogate a claim, verify a statistic, or surface a pattern that nobody thought to look for. That is a meaningful change in the relationship between citizens and public information.
