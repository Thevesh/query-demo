export type DatasetKey = keyof typeof DATASETS;

export const DATASETS = {
  ballots: "https://demo.thevesh.com/2026-05-ogp/ballots.parquet",
  stats: "https://demo.thevesh.com/2026-05-ogp/stats.parquet",
} as const;

export const DATASET_LABELS: Record<DatasetKey, string> = {
  ballots: "ballots",
  stats: "stats",
};

export const DATASET_DESCRIPTIONS: Record<DatasetKey, string> = {
  ballots: "Votes won by all candidates since 1955, together with party affiliation",
  stats:
    "Aggregated seat-level statistics e.g. voter turnout and majority",
};

export const DEFAULT_DATASET: DatasetKey = "ballots";
