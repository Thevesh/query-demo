import type { DatasetKey } from "./datasets";

export interface InterestingQuestion {
  question: string;
  group: "Seats" | "Parties" | "Candidates";
  dataset: DatasetKey;
  sql: string;
}

export const INTERESTING_QUESTIONS: InterestingQuestion[] = [
  {
    group: "Seats",
    question: "What was the smallest winning margin ever?",
    dataset: "stats",
    sql: "SELECT\n  year,\n  constituency,\n  majority,\n  ROUND(majority_perc, 3) as majority_perc\nFROM\n  stats\nWHERE\n  majority_perc IS NOT NULL -- excludes uncontested seats\nORDER BY\n  majority ASC\nLIMIT\n  10",
  },
  {
    group: "Seats",
    question: "Is voting power equal across constituencies?",
    dataset: "stats",
    sql: "SELECT\n  constituency,\n  constituency_type,\n  n_member,\n  electors,\n  ROUND(electors / n_member, 0) AS electors_per_mp,\n  PRINTF('%.2fx', (electors / n_member) / AVG(electors / n_member) OVER ()) AS size_vs_avg\nFROM stats\nWHERE year = (\n  SELECT MAX(year)\n  FROM stats\n)\nORDER BY electors_per_mp DESC",
  },
  {
    group: "Seats",
    question: "How has the SMC-GRC split changed over time?",
    dataset: "stats",
    sql: "SELECT\n  year,\n  COUNT(*) FILTER (WHERE n_member = 1) AS \"1 member\",\n  COUNT(*) FILTER (WHERE n_member = 2) AS \"2 members\",\n  COUNT(*) FILTER (WHERE n_member = 3) AS \"3 members\",\n  COUNT(*) FILTER (WHERE n_member = 4) AS \"4 members\",\n  COUNT(*) FILTER (WHERE n_member = 5) AS \"5 members\",\n  COUNT(*) FILTER (WHERE n_member = 6) AS \"6 members\"\nFROM stats\nGROUP BY year\nORDER BY year",
  },
  {
    group: "Seats",
    question: "Which years had the most walkovers?",
    dataset: "stats",
    sql: "WITH totals AS (\n  SELECT year, COUNT(*) AS total_constituencies\n  FROM stats\n  GROUP BY year\n),\nwalkovers AS (\n  SELECT year, COUNT(DISTINCT constituency) AS walkover_constituencies\n  FROM ballots\n  WHERE result = 'won_uncontested'\n  GROUP BY year\n)\nSELECT\n  w.year,\n  w.walkover_constituencies,\n  t.total_constituencies,\n  ROUND(w.walkover_constituencies * 100.0 / t.total_constituencies, 1) AS pct_walkovers\nFROM walkovers w\nJOIN totals t ON w.year = t.year\nORDER BY walkover_constituencies DESC",
  },
  {
    group: "Parties",
    question: "What were the results of the latest election?",
    dataset: "ballots",
    sql: "WITH slate_votes AS (\n  SELECT DISTINCT\n    year,\n    constituency,\n    constituency_type,\n    n_member,\n    party,\n    rank,\n    votes\n  FROM ballots\n  WHERE year = (SELECT MAX(year) FROM ballots)\n),\nparty_votes AS (\n  SELECT party, SUM(votes) AS total_votes\n  FROM slate_votes\n  GROUP BY party\n),\nparty_seats AS (\n  SELECT party, COUNT(*) AS seats_won\n  FROM ballots\n  WHERE year = (SELECT MAX(year) FROM ballots)\n    AND result IN ('won', 'won_uncontested')\n  GROUP BY party\n)\nSELECT\n  pv.party,\n  COALESCE(ps.seats_won, 0) AS seats,\n  ROUND(COALESCE(ps.seats_won, 0) * 100.0 / SUM(COALESCE(ps.seats_won, 0)) OVER (), 1) AS seats_perc,\n  CAST(pv.total_votes AS INTEGER) AS votes,\n  ROUND(pv.total_votes * 100.0 / SUM(pv.total_votes) OVER (), 1) AS votes_perc\nFROM party_votes pv\nLEFT JOIN party_seats ps ON pv.party = ps.party\nORDER BY seats DESC, votes DESC",
  },
  {
    group: "Candidates",
    question: "What was Lee Kuan Yew's electoral record?",
    dataset: "ballots",
    sql: "SELECT\n  year,\n  constituency,\n  constituency_type,\n  n_member,\n  party,\n  votes,\n  votes_perc,\n  result\nFROM ballots\nWHERE candidate = 'Lee Kuan Yew'\nORDER BY year",
  },
  {
    group: "Parties",
    question: "How has the PAP's electoral performance changed over time?",
    dataset: "ballots",
    sql: "WITH slate_votes AS (\n  SELECT DISTINCT\n    year,\n    constituency,\n    constituency_type,\n    n_member,\n    party,\n    rank,\n    votes\n  FROM ballots\n),\nannual_votes AS (\n  SELECT\n    year,\n    SUM(votes) FILTER (WHERE party = 'PAP') AS pap_votes,\n    SUM(votes) AS total_votes\n  FROM slate_votes\n  GROUP BY year\n),\nannual_seats AS (\n  SELECT\n    year,\n    COUNT(*) FILTER (WHERE result IN ('won', 'won_uncontested')) AS total_seats,\n    COUNT(*) FILTER (WHERE party = 'PAP') AS seats_contested,\n    COUNT(*) FILTER (WHERE party = 'PAP' AND result IN ('won', 'won_uncontested')) AS pap_seats\n  FROM ballots\n  GROUP BY year\n)\nSELECT\n  av.year,\n  as_.total_seats,\n  as_.seats_contested,\n  as_.pap_seats AS seats_won,\n  ROUND(as_.pap_seats * 100.0 / as_.total_seats, 1) AS seat_share,\n  CAST(av.pap_votes AS INTEGER) AS votes_won,\n  ROUND(av.pap_votes * 100.0 / av.total_votes, 1) AS vote_share\nFROM annual_votes av\nJOIN annual_seats as_ ON av.year = as_.year\nORDER BY av.year",
  },
  {
    group: "Candidates",
    question: "Who has contested the most elections?",
    dataset: "ballots",
    sql: "SELECT\n  candidate,\n  COUNT(DISTINCT year) AS elections,\n  CAST(MIN(year) AS VARCHAR) AS first,\n  CAST(MAX(year) AS VARCHAR) AS last,\n  COUNT(*) FILTER (WHERE result IN ('won', 'won_uncontested')) AS wins,\n  COUNT(*) FILTER (WHERE result IN ('lost', 'lost_deposit')) AS losses\nFROM ballots\nGROUP BY candidate\nORDER BY elections DESC, last DESC\nLIMIT 20",
  },
  {
    group: "Parties",
    question: "How has the Workers' Party performed over time?",
    dataset: "ballots",
    sql: "WITH slate_votes AS (\n  SELECT DISTINCT\n    year,\n    constituency,\n    constituency_type,\n    n_member,\n    party,\n    rank,\n    votes\n  FROM ballots\n),\nannual_votes AS (\n  SELECT\n    year,\n    SUM(votes) FILTER (WHERE party = 'WP') AS wp_votes,\n    SUM(votes) AS total_votes\n  FROM slate_votes\n  GROUP BY year\n),\nannual_seats AS (\n  SELECT\n    year,\n    COUNT(*) FILTER (WHERE result IN ('won', 'won_uncontested')) AS total_seats,\n    COUNT(*) FILTER (WHERE party = 'WP') AS seats_contested,\n    COUNT(*) FILTER (WHERE party = 'WP' AND result IN ('won', 'won_uncontested')) AS wp_seats\n  FROM ballots\n  GROUP BY year\n)\nSELECT\n  av.year,\n  as_.total_seats,\n  as_.seats_contested,\n  ROUND(as_.seats_contested * 100.0 / as_.total_seats, 1) AS contested_share,\n  as_.wp_seats AS seats_won,\n  ROUND(as_.wp_seats * 100.0 / as_.total_seats, 1) AS seat_share,\n  CAST(av.wp_votes AS INTEGER) AS votes_won,\n  ROUND(av.wp_votes * 100.0 / av.total_votes, 1) AS vote_share\nFROM annual_votes av\nJOIN annual_seats as_ ON av.year = as_.year\nWHERE as_.seats_contested > 0\nORDER BY av.year",
  },
  {
    group: "Candidates",
    question: "Who has lost the most electoral contests?",
    dataset: "ballots",
    sql: "SELECT\n  candidate,\n  COUNT(*) FILTER (WHERE result IN ('lost', 'lost_deposit')) AS losses,\n  COUNT(*) FILTER (WHERE result IN ('won', 'won_uncontested')) AS wins,\n  CAST(MIN(year) FILTER (WHERE result IN ('lost', 'lost_deposit')) AS VARCHAR) AS first_loss,\n  FIRST(party ORDER BY year) AS first_party,\n  CAST(MAX(year) FILTER (WHERE result IN ('lost', 'lost_deposit')) AS VARCHAR) AS last_loss,\n  LAST(party ORDER BY year) AS last_party\nFROM ballots\nGROUP BY candidate\nHAVING losses > 0\nORDER BY losses DESC, last_loss DESC\nLIMIT 20",
  },
];
