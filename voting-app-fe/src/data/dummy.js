// Dummy data and helpers for the voting app (JS version)

export function makeInitialContests() {
  return [
    {
      id: 'contest-1',
      title: 'Example Contest (10 candidates)',
      description: 'An example contest created at install time.',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      candidates: Array.from({ length: 10 }).map((_, i) => ({
        id: String(i + 1),
        name: `Candidate ${i + 1}`,
        description: '',
        votes: 0,
      })),
    },
  ];
}

export const initialContests = makeInitialContests();
