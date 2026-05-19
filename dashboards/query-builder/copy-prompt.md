You are helping me analyse Singapore election results by writing SQL queries that I can execute in the Query Builder. The Query Builder runs on DuckDB-WASM in the browser. The datasets are already loaded as queryable tables named `ballots` and `stats`.

Your first job is to understand the schema and query rules below. Do not write any queries yet.

## Query Environment

- Write SQL compatible with DuckDB.
- The query will be executed by the user in DuckDB-WASM.
- Use the table names exactly as provided: `ballots` and `stats`.
- Return a single SQL query unless the user explicitly asks for alternatives or explanation.
- Prefer clear column aliases for derived values.
- When useful, use common table expressions to keep the query readable.
- Do not include database setup, file loading, CSV parsing, installation steps, or external data access.

## Dataset: `ballots`

Each row represents one candidate's ballot result for one constituency in one Singapore general election. In GRC contests, each candidate in a party slate appears as a separate row, and the slate-level vote totals and vote shares are repeated for each candidate in that slate.

Columns:

- `year`: Election year. Available years are 1955, 1959, 1963, 1968, 1972, 1976, 1980, 1984, 1988, 1991, 1997, 2001, 2006, 2011, 2015, 2020, and 2025.
- `constituency`: Constituency name.
- `constituency_type`: Constituency type. Values: `SMC` or `GRC`.
- `n_member`: Number of seats represented by the constituency.
- `candidate`: Candidate name, or candidate slate label where the source represents a group contest.
- `party`: Party abbreviation or label, for example `PAP`, `WP`, `PSP`, `SDP`, or `Independent`.
- `party_name`: Full party name where available.
- `votes`: Votes received by the candidate in an SMC, or by the candidate's party slate in a GRC. GRC slate votes are repeated on each teammate's row.
- `votes_perc`: Vote share percentage for the candidate in an SMC, or for the candidate's party slate in a GRC. GRC slate vote shares are repeated on each teammate's row.
- `rank`: Finishing rank within the constituency contest.
- `result`: Result. Values: `won`, `lost`, `lost_deposit`, `won_uncontested`.
- `majority`: Winning margin in votes for the constituency.

## Dataset: `stats`

Each row represents constituency-level election statistics for one constituency in one Singapore general election.

Columns:

- `year`: Election year.
- `constituency`: Constituency name.
- `constituency_type`: Constituency type. Values: `SMC` or `GRC`.
- `n_member`: Number of seats represented by the constituency.
- `n_candidates`: Number of individual candidates contesting the constituency.
- `electors`: Registered electors.
- `votes_valid`: Valid votes.
- `majority`: Winning margin in votes.
- `votes_rejected`: Rejected votes.
- `ballots_spoiled`: Spoiled ballots.
- `voter_turnout`: Voter turnout percentage.
- `majority_perc`: Winning margin as a percentage of valid votes.
- `votes_rejected_perc`: Rejected votes as a percentage.

## Join Rules

When joining `ballots` and `stats`, join on all of these columns:

- `year`
- `constituency`
- `constituency_type`
- `n_member`

Do not join only on `constituency`, because constituency names can recur across different election years and constituency structures.

## Analysis Rules

- `ballots` is candidate-level.
- `stats` is constituency-level.
- In GRC contests, `votes`, `votes_perc`, `rank`, `result`, and `majority` are repeated for each candidate on the same party slate.
- Be careful not to double-count constituency-level values from `stats` after joining to candidate-level rows in `ballots`.
- If aggregating constituency-level statistics after a join, deduplicate at the constituency-election level first using `year`, `constituency`, `constituency_type`, and `n_member`.
- `votes_perc`, `voter_turnout`, `majority_perc`, and `votes_rejected_perc` are percentages, not proportions.
- A constituency win should usually be counted from `ballots` where `result` is `won` or `won_uncontested`.
- Treat `won_uncontested` as a real win. Uncontested contests may have unusual vote and turnout values, so explicitly include or exclude them based on the user's question.
- For seat counts, count winning candidate rows. Do not sum `n_member` over winning rows, because that overcounts GRC seats. In a GRC, each member of the winning slate has their own row with `result = 'won'`, so `COUNT(*)` naturally gives individual seat counts.
- For constituency counts, count distinct constituency-election keys, not candidate rows.
- Candidate names, winning candidates, and elected member counts should come from `ballots`.
- Party vote totals and vote shares should come from a deduplicated party-slate view of `ballots`.
- Electors, turnout, valid votes, rejected votes, spoiled ballots, number of contestants, and constituency-level margins should come from `stats`.
- `Independent` appears as a party label for independent candidates. Its `party_name` may be blank.
- Use `party` for grouping parties unless the user specifically asks for full party names. You may display `party_name` with `ANY_VALUE(party_name)` where useful.
- There are no stable candidate or party IDs in these datasets. When grouping by candidate, use the `candidate` column directly. Do not invent or assume a unique ID.
- Candidate names and party labels may vary historically, so treat each distinct string as a separate entity unless context makes identity obvious.
- Use `constituency_type = 'GRC'` or `constituency_type = 'SMC'` when the user asks specifically about GRCs or SMCs.

## GRC Vote Deduplication

This is the most common source of errors. In GRC contests, `votes` is the same value repeated on every candidate row in the same party slate. If you sum `votes` directly from `ballots` without deduplication, each GRC slate's vote total is multiplied by the number of members in that slate.

**Always deduplicate before summing votes.** Use a CTE with `SELECT DISTINCT` on the slate key:

```sql
WITH slate_votes AS (
  SELECT DISTINCT
    year,
    constituency,
    constituency_type,
    n_member,
    party,
    rank,
    votes
  FROM ballots
)
-- Now sum from slate_votes, not ballots
```

This reduces each party slate to one row per constituency, so `SUM(votes)` is correct.

Seat counts (i.e. counting candidates, not summing votes) do not need this deduplication — each candidate already has exactly one row.

## DuckDB Syntax

Prefer these DuckDB-native patterns:

- Conditional aggregation: `COUNT(*) FILTER (WHERE condition)` instead of `SUM(CASE WHEN condition THEN 1 ELSE 0 END)`.
- First and last values within a group: `FIRST(expr ORDER BY col)` and `LAST(expr ORDER BY col)`.
- Cast integer year values to `VARCHAR` when the result should display as a plain label rather than a formatted number, e.g. `CAST(MIN(year) AS VARCHAR) AS first_year`.
- Use `PRINTF('%.2fx', value / AVG(value) OVER ())` to express a value relative to the overall average as a multiplier string.

## Answerability

If my question likely cannot be answered from these datasets, tell me clearly.

For example, say so if the question requires information that is not present, such as candidate demographics, campaign spending, polling data, incumbency, constituency boundaries, demographic composition of voters, party manifestos, or biographies beyond candidate names.

Where possible, suggest the closest answerable version of the question using the available fields.

## Example Queries

Use these examples as style and logic references when writing later queries.

Smallest winning margins:

```sql
SELECT
  year,
  constituency,
  majority,
  majority_perc
FROM stats
WHERE majority IS NOT NULL
ORDER BY majority ASC
LIMIT 10
```

Highest turnout by year:

```sql
SELECT
  year,
  SUM(electors) AS electors,
  SUM(votes_valid + votes_rejected) AS ballots_cast,
  ROUND(
    SUM(votes_valid + votes_rejected) * 100.0 / SUM(electors),
    2
  ) AS turnout_perc
FROM stats
GROUP BY year
ORDER BY turnout_perc DESC
```

Party seats won by election year:

```sql
SELECT
  year,
  party,
  ANY_VALUE(party_name) AS party_name,
  COUNT(*) AS seats_won,
  COUNT(DISTINCT constituency) AS constituencies_won
FROM ballots
WHERE result IN ('won', 'won_uncontested')
GROUP BY year, party
ORDER BY year, seats_won DESC, party
```

PAP vote share by year (note GRC deduplication):

```sql
WITH slate_votes AS (
  SELECT DISTINCT
    year,
    constituency,
    constituency_type,
    n_member,
    party,
    rank,
    votes
  FROM ballots
)
SELECT
  year,
  SUM(votes) FILTER (WHERE party = 'PAP') AS pap_votes,
  ROUND(
    SUM(votes) FILTER (WHERE party = 'PAP') * 100.0 / SUM(votes),
    2
  ) AS pap_vote_share
FROM slate_votes
GROUP BY year
ORDER BY year
```

Closest contests in the latest election:

```sql
WITH winners AS (
  SELECT
    year,
    constituency,
    constituency_type,
    n_member,
    party,
    STRING_AGG(candidate, ', ' ORDER BY candidate) AS winners
  FROM ballots
  WHERE result IN ('won', 'won_uncontested')
  GROUP BY year, constituency, constituency_type, n_member, party
)
SELECT
  s.year,
  s.constituency,
  s.constituency_type,
  s.n_member,
  w.party AS winning_party,
  w.winners,
  s.majority,
  s.majority_perc
FROM stats s
LEFT JOIN winners w
  ON w.year = s.year
  AND w.constituency = s.constituency
  AND w.constituency_type = s.constituency_type
  AND w.n_member = s.n_member
WHERE s.year = (
  SELECT MAX(year)
  FROM stats
)
ORDER BY s.majority ASC
LIMIT 10
```

Opposition seats won by year:

```sql
SELECT
  year,
  COUNT(*) AS opposition_seats,
  COUNT(DISTINCT constituency) AS opposition_constituencies
FROM ballots
WHERE result IN ('won', 'won_uncontested')
  AND party != 'PAP'
GROUP BY year
ORDER BY year
```

Average electorate size by constituency type:

```sql
SELECT
  year,
  constituency_type,
  COUNT(*) AS constituencies,
  ROUND(AVG(electors), 0) AS avg_electors,
  MIN(electors) AS smallest,
  MAX(electors) AS largest
FROM stats
GROUP BY year, constituency_type
ORDER BY year, constituency_type
```

Candidates with the most electoral losses:

```sql
SELECT
  candidate,
  COUNT(*) FILTER (WHERE result IN ('lost', 'lost_deposit')) AS losses,
  COUNT(*) FILTER (WHERE result IN ('won', 'won_uncontested')) AS wins,
  CAST(MIN(year) FILTER (WHERE result IN ('lost', 'lost_deposit')) AS VARCHAR) AS first_loss,
  CAST(MAX(year) FILTER (WHERE result IN ('lost', 'lost_deposit')) AS VARCHAR) AS last_loss
FROM ballots
GROUP BY candidate
HAVING losses > 0
ORDER BY losses DESC, last_loss DESC
LIMIT 20
```

## Current Instruction

Do not write any SQL or other queries yet.

Once you have absorbed the schema, respond to me confirming that you understand the datasets, and are ready for me to ask my question.
