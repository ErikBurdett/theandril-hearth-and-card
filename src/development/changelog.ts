export type Change = {
  sha: string;
  date: string;
  subject: string;
  body: string;
  files: number;
  areas: string[];
};

export function filterChanges(changes: Change[], query: string) {
  const needle = query.trim().toLowerCase();
  return changes.filter((entry) =>
    `${entry.sha} ${entry.subject} ${entry.body} ${entry.areas.join(" ")}`
      .toLowerCase()
      .includes(needle),
  );
}
