# Civic participation | SG Election Explorer

*Live demo: [omedpgo.thevesh.com/](https://omedpgo.thevesh.com/) · Data sourced from [data.gov.sg](https://data.gov.sg/datasets?agencies=Elections+Department+(ELD)&resultId=1531)*

## Problem Statement

Singapore's election data is technically public, since the Elections Department publishes results after every General Election. [data.gov.sg](https://elections.data.gov.sg/en) has done great work making this data more accesible—but this can be improved!

**The main problem: Public data that is not usable by non-technical citizens.** A downloadable CSV file containing raw data is not the same as data you can query. Converting raw election results into a usable format—cleaning, normalising, generating meaningful derived fields, and storing it in a queryable structure—requires non-trivial engineering work. Most citizens never get past the first download.

Three specific failure modes make this worse:

**1. Intelligent non-coders are underserved.** Political curiosity is not correlated with SQL proficiency. A voter who wants to know whether voting power is equal across constituencies, or how Workers' Party's vote share has trended over 70 years, has no practical way to easily answer that question. They can read a journalist's take, or trust their intuition. They cannot interrogate the data themselves. This product gives them that ability through an AI prompt that converts a plain-English question into a runnable SQL query.

**2. Data-savvy users face pipeline friction.** Analysts and journalists who *could* query the data still spend hours building and maintaining ETL pipelines before they write a single query. Every General Election requires re-ingesting, re-cleaning, and re-validating data. This product automates that entirely: datasets are pre-processed, served as Parquet files on a CDN, and ready to query within seconds

**3. Pure AI for data analysis is hallucination-prone.** A straightforward fix—dumping the CSV into ChatGPT—often fails because LLMs confidently fabricate specific vote counts, candidate names, and constituency boundaries. The worst part is that these errors are essentially undetectable unless you already have superhuman memory of the exact data. Therefore, the correct architecture is to bring the query to the data, not the data to the AI. This product uses AI only to write SQL; the actual computation runs against a clean, validated dataset.

## Features & Prioritisation

**P0: AI-assisted query generation.** A pre-built prompt, bundled in the product, gives any LLM the full schema and context it needs to convert a natural-language question into valid SQL. Users copy the prompt, paste it into any AI tool, and ask their question. The AI writes the SQL; the user pastes it back. This single feature eliminates the SQL barrier without locking users into one AI provider or incurring API costs.

**P0: In-browser SQL execution via DuckDB WASM.** Queries run entirely in the browser using DuckDB compiled to WebAssembly. There is no backend, no server, no query queue. A user with a mid-range laptop can join two datasets spanning 70 years of election data and get results in under 200ms. This also means zero infrastructure cost per query run, and no data ever leaves the user's device.

**P1: Curated sample queries.** Twelve pre-written questions covering seats, parties, and candidates serve two purposes: onboarding for users who want to explore without knowing what to ask, and a quality signal that demonstrates what the data can answer. Sample queries are the product's "show, don't tell."

**P1: Shareable encoded URLs.** A user's query is fully encoded in the URL. Anyone with the link can open it with the same query ready to run. No login, no storage, no server round-trip. This turns individual analysis into civic conversation: a journalist can share a query, a teacher can assign one, a voter can fact-check a claim by sharing the exact computation that produced it.

**P2: CSV export and short links.** Copy-to-CSV enables downstream analysis, if needed. GoGovSG short links make URLs shareable in messages and social posts. Both reduce friction at the output stage without requiring any architectural changes.

Features deliberately not built: user accounts, saved queries, visualisation charts, commenting. These add complexity without meaningfully expanding the audience at this stage.


## Implementation

**Stack:**
- **DuckDB WASM**: Columnar analytics engine compiled to WebAssembly. Handles multi-table joins and window functions over millions of rows in the browser. Eliminates the need for a query execution backend entirely.
- **Parquet on CDN**: Election datasets are pre-processed and hosted as Parquet files. Parquet's columnar layout means DuckDB only reads the columns a query touches, not the full dataset. Files are typically 10× smaller than equivalent CSVs and load efficiently over HTTP range requests.
- **CodeMirror with SQL dialect**: Browser-native code editor with SQL syntax highlighting and bracket matching. Familiar enough for technical users; non-threatening for everyone else because they are pasting AI-generated code, not writing from scratch.
- **Next.js**: Least important part of the stack. I used it because I'm familiar with it, but you could swap it out for vanilla HTML/CSS/JS if you wanted. Similar, this demo is deployed on Vercel for convenience, but it doesn't have to be.

**Wishlist (not built here, for parsimony):**
- Cloudflare Turnstile: Bot protection on the short-link generation endpoint and any future server-side features. Without it, a viral spike is also an invitation for abuse. Turnstile is invisible to real users and free at reasonable volumes.
- ClickHouse for usage analytics.
- GoGovSG short-link integration: The short-link button is stubbed in this demo.
Automated data pipeline: Currently the Parquet files are built and uploaded manually. A lightweight pipeline would validate the data, regenerate the Parquet files, and push them to the CDN automatically.

**Constraints and trade-offs considered:**

1.  *Bring-your-own-AI vs. embedded AI.* The most obvious alternative to the copy-prompt approach is to embed an AI directly in the product—the user types a question, the product calls an LLM API, and SQL appears automatically. I deliberately rejected this approach for three reasons. First, cost: LLM API calls are not cheap, and an election product can balloon costs overnight, which is the wrong property for a civic tool with no revenue model. Second, privacy: an embedded AI requires routing user queries through a server, which means logging, retention risk, and the question of what we do with the data. With the copy-prompt approach, nothing the user types ever leaves their browser unless they choose to generate a short link. Third, provider lock-in: in particular, being prone to its downtime. The copy-prompt approach works with any LLM.

2. *DuckDB (client-side) vs. API (server-side).* The alternative to running DuckDB in the browser is a server that accepts queries and returns results. That approach has a marginal cost for every query run, or a fixed infra cost. With client-side DuckDB, the user's own device does the computation. A million query runs cost the same as ten. This is distributed computing in the most literal sense: every visitor brings their own CPU. The trade-off is a ~5MB WASM bundle on first load, adding a few seconds of cold-start latency. This is mitigated by loading the bundle lazily after the page renders, so the UI is immediately interactive while DuckDB initialises in the background.

3. *Expose the SQL vs. hide the SQL.* A natural instinct is to hide the SQL entirely—show a text box, return a table, abstract away the mechanics. I chose not to. Showing the SQL serves two purposes. First, transparency: a user can see exactly what computation produced the result they're looking at. Second, education: many Singaporeans are capable of learning or at least understanding SQL if given a working example and gentle exposure. Showing AI-generated SQL alongside its output is one of the most effective ways to teach it. The intimidation concern is real but manageable—especially with a rich array of sample queries.


## Launch & Rollout

**Phase 1: Soft launch (anytime, against historical data).** The product can go live at any point. Historical data going back to 1955 is already rich enough to be genuinely interesting—the 70-year arc of party dominance, the GRC system's evolution, individual candidates' electoral records. Launching early lets us build an audience, surface data issues, and iterate on the UX without the time pressure of a live election.

**Phase 2: Stress test and feedback.** A small group of journalists, academics, and civic tech contributors are invited to push the product hard: run unusual queries, probe edge cases, and tell us what questions the data can't yet answer. Gaps in the dataset or UX are fixed at low stakes, not on results night.

**Phase 3: All-out promotion from Parliament dissolution onward.** When Parliament is dissolved, the ~month-long campaign period that follows is when civic curiosity peaks—candidates are announced, boundaries are scrutinised, historical comparisons are drawn. This is the window for concentrated promotion: social posts, journalist outreach, shareable query links on timely questions. The product doesn't launch here; it is already live and battle-tested. On results night, updated Parquet files are published and the product is immediately ready. A single well-crafted shareable query ("here is the exact computation showing how vote share translates to seats") can seed wide organic distribution at exactly the right moment.

**Ongoing**: Monitor query failure rates and activation. Expand the dataset scope based on what users are actually trying to ask—boundary data, nomination information, by-election history.


## Measuring Success

**Activation rate**: % of sessions in which a user runs at least one query. A product that people open and immediately close has a 'intimidation' problem.

**Query diversity**: Number of distinct queries run (approximated by unique encoded URLs). A high ratio of unique-to-total queries indicates genuine exploration, not just sample query clicks.

**Share link generation**: Number of encoded URLs copied or GoGovSG short links generated. Shares are the primary distribution mechanism and a strong signal of perceived value.

**Downstream citations**: Media articles, academic papers, or social posts that reference the tool or link to a specific query. Qualitative but high-signal.

**Visit concentration**: % drop in views during 'peacetime' relative to election season. If the tool is useful only on election day, it has solved a narrow problem. If users return to run queries months later, it has become infrastructure.

What I would not optimise for: Raw page views (easily inflated by press coverage with zero retention) and time-on-site (a fast, efficient query is better than a slow, engaging one).


## Long-term Vision

The immediate product is an election data explorer. The long-term vision is a civic data layer for Singapore.

Elections are one dataset. The same architecture—pre-processed Parquet files, DuckDB WASM, AI-assisted query generation, shareable URLs—applies to housing resale prices, CPF contribution data, school enrollment figures, hospital waiting times, and every other dataset the government publishes. The product is a query interface; the data is interchangeable.

The deeper shift is epistemic. Today, most public policy debates in Singapore are conducted without citizens having meaningful access (meaningful = matching Singaporeans' high level of intelligence and curiosity) to the numbers underlying them. Assertions are taken on faith or contested through proxies. A civic data layer makes it possible for any Singaporean—not just those with data engineering skills or institutional resources—to interrogate a claim, verify a statistic, or surface a pattern that nobody thought to look for.

That is a meaningful change in the relationship between citizens and public information.
