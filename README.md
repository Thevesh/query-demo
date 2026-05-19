# Civic participation | SG Election Explorer

*Live demo: [go.gov.sg/omedpgo](https://go.gov.sg/omedpgo) · Data sourced from [data.gov.sg](https://data.gov.sg/datasets?agencies=Elections+Department+(ELD)&resultId=1531)*

## Problem Statement

Singapore's election data is technically public, since the Elections Department publishes results after every General Election. [data.gov.sg](https://elections.data.gov.sg/en) has done great work making this data more accesible—but this can be improved!

**The main problem: public data that is not usable by non-technical citizens.** A downloadable CSV file containing raw data is not the same as data you can query. Converting raw election results into a usable format—cleaning, normalising, generating meaningful derived fields, and storing it in a queryable structure—requires non-trivial engineering work. Most citizens never get past the first download.

Three specific failure modes make this worse:

**1. Intelligent non-coders are underserved.** Political curiosity is not correlated with SQL proficiency. A voter who wants to know whether voting power is equal across constituencies, or how Workers' Party's vote share has trended over 70 years, has no practical way to easily answer that question. They can read a journalist's take, or trust their intuition. They cannot interrogate the data themselves. This product gives them that ability through an AI prompt that converts a plain-English question into a runnable SQL query.

**2. Data-savvy users face pipeline friction.** Analysts and journalists who *could* query the data still spend hours building and maintaining ETL pipelines before they write a single query. Every General Election requires re-ingesting, re-cleaning, and re-validating data. This product automates that entirely: datasets are pre-processed, served as Parquet files on a CDN, and ready to query within seconds

**3. Pure AI for data analysis is hallucination-prone.** A straightforward fix—dumping the CSV into ChatGPT—often fails because LLMs confidently fabricate specific vote counts, candidate names, and constituency boundaries. The worst part is that these errors are essentially undetectable unless you already have superhuman memory of the exact data. Therefore, the correct architecture is to bring the query to the data, not the data to the AI. This product uses AI only to write SQL; the actual computation runs against a clean, validated dataset.

## Features & Prioritisation

**P0 — AI-assisted query generation.** A pre-built prompt, bundled in the product, gives any LLM the full schema and context it needs to convert a natural-language question into valid SQL. Users copy the prompt, paste it into any AI tool, and ask their question. The AI writes the SQL; the user pastes it back. This single feature eliminates the SQL barrier without locking users into one AI provider or incurring API costs.

**P0 — In-browser SQL execution via DuckDB WASM.** Queries run entirely in the browser using DuckDB compiled to WebAssembly. There is no backend, no server, no query queue. A user with a mid-range laptop can join two datasets spanning 70 years of election data and get results in under 200ms. This also means zero infrastructure cost per query run, and no data ever leaves the user's device.

**P1 — Curated sample queries.** Twelve pre-written questions covering seats, parties, and candidates serve two purposes: onboarding for users who want to explore without knowing what to ask, and a quality signal that demonstrates what the data can answer. Sample queries are the product's "show, don't tell."

**P1 — Shareable encoded URLs.** A user's query is fully encoded in the URL. Anyone with the link can open it with the same query ready to run. No login, no storage, no server round-trip. This turns individual analysis into civic conversation: a journalist can share a query, a teacher can assign one, a voter can fact-check a claim by sharing the exact computation that produced it.

**P2 — CSV export and short links.** Copy-to-CSV enables downstream analysis, if needed. GoGovSG short links make URLs shareable in messages and social posts. Both reduce friction at the output stage without requiring any architectural changes.

Features deliberately not built: user accounts, saved queries, visualisation charts, commenting. These add complexity without meaningfully expanding the audience at this stage.


## Implementation

**Stack:**
- **DuckDB WASM** — columnar analytics engine compiled to WebAssembly. Handles multi-table joins and window functions over millions of rows in the browser. Eliminates the need for a query execution backend entirely.
- **Parquet on CDN** — election datasets are pre-processed and hosted as Parquet files. Parquet's columnar layout means DuckDB only reads the columns a query touches, not the full dataset. Files are typically 5–10× smaller than equivalent CSVs and load efficiently over HTTP range requests.
- **CodeMirror with SQL dialect** — browser-native code editor with SQL syntax highlighting and bracket matching. Familiar enough for technical users; non-threatening for everyone else because they are pasting AI-generated code, not writing from scratch.
- **Next.js** — least important part of the stack. I used it because I'm familiar with it, but you could swap it out for vanilla HTML/CSS/JS if you wanted. 

**Constraints and trade-offs considered:**

- *WASM has a cold-start cost.* The DuckDB WASM bundle is ~5MB and must be fetched on first load. This is a one-time cost per session; subsequent queries are sub-200ms. Mitigation: the bundle is loaded lazily after the page renders, so the UI is immediately interactive.

- *SQL is a leaky abstraction for non-coders.* Even with AI assistance, a user who gets a syntax error may not know how to fix it. Mitigation: the sample queries demonstrate correct patterns; the AI prompt includes schema context that significantly reduces error rates; error messages are surfaced clearly in the UI.

- *No server means no usage analytics by default.* Standard page-view analytics (e.g. Plausible) can be added without a backend, but query-level telemetry (which questions users are asking, which queries fail) would require either a lightweight logging endpoint or a client-side analytics solution with event tracking.


## Launch & Rollout

**Phase 1 — Soft launch (anytime, against historical data).** The product can go live at any point. Historical data going back to 1955 is already rich enough to be genuinely interesting — the 70-year arc of party dominance, the GRC system's evolution, individual candidates' electoral records. Launching early lets us build an audience, surface data issues, and iterate on the UX without the time pressure of a live election.

**Phase 2 — Stress test and feedback.** A small group of journalists, academics, and civic tech contributors are invited to push the product hard: run unusual queries, probe edge cases, and tell us what questions the data can't yet answer. Gaps in the dataset or UX are fixed at low stakes, not on results night.

**Phase 3 — All-out promotion from Parliament dissolution onward.** When Parliament is dissolved, the ~month-long campaign period that follows is when civic curiosity peaks — candidates are announced, boundaries are scrutinised, historical comparisons are drawn. This is the window for concentrated promotion: social posts, journalist outreach, shareable query links on timely questions. The product doesn't launch here; it is already live and battle-tested. On results night, updated Parquet files are published and the product is immediately ready. A single well-crafted shareable query ("here is the exact computation showing how vote share translates to seats") can seed wide organic distribution at exactly the right moment.

**Ongoing.** Monitor query failure rates and activation. Expand the dataset scope based on what users are actually trying to ask — boundary data, nomination information, by-election history.


## Measuring Success

**Activation rate** — the percentage of sessions in which a user runs at least one query. A product that people open and immediately close has a discovery problem; a product where most visitors run a query has found its audience.

**Query diversity** — the number of distinct queries run (approximated by unique encoded URLs). A high ratio of unique-to-total queries indicates genuine exploration, not just sample query clicks.

**Share link generation** — the number of encoded URLs copied or GoGovSG short links generated. Shares are the primary distribution mechanism and a strong signal of perceived value.

**Downstream citations** — media articles, academic papers, or social posts that reference the tool or link to a specific query. Qualitative but high-signal.

**Return visits** — the proportion of users who return after the initial GE news cycle. If the tool is useful only on election day, it has solved a narrow problem. If users return to run queries months later, it has become infrastructure.

What I would not optimise for: raw page views (easily inflated by press coverage with zero retention) and time-on-site (a fast, efficient query is better than a slow, engaging one).


## Long-term Vision

The immediate product is an election data explorer. The long-term vision is a civic data layer for Singapore.

Elections are one dataset. The same architecture — pre-processed Parquet files, DuckDB WASM, AI-assisted query generation, shareable URLs — applies to housing resale prices, CPF contribution data, school enrollment figures, hospital waiting times, and every other dataset the government publishes. The product is a query interface; the data is interchangeable.

The deeper shift is epistemic. Today, most public policy debates in Singapore are conducted without citizens having meaningful access (meaningful = matching Singaporeans' high level of intelligence and curiosity) to the numbers underlying them. Assertions are taken on faith or contested through proxies. A civic data layer makes it possible for any Singaporean—not just those with data engineering skills or institutional resources—to interrogate a claim, verify a statistic, or surface a pattern that nobody thought to look for.

That is a meaningful change in the relationship between citizens and public information.
