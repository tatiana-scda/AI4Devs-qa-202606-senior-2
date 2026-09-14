// Mock axios
jest.mock('axios');

const {
  calculateAverageScore,
  organizeCandidatesByStage,
  fetchInterviewSteps,
  fetchCandidatesWithApplications,
} = require('./kanbanService');

const mockInterviewSteps = [
  { id: 1, name: 'Applied', orderIndex: 0 },
  { id: 2, name: 'Screening', orderIndex: 1 },
  { id: 3, name: 'Technical Interview', orderIndex: 2 },
  { id: 4, name: 'HR Interview', orderIndex: 3 },
];

const mockApplications = [
  { id: 1, candidateId: 1, positionId: 1, currentInterviewStep: 1, interviews: [{ score: 4 }, { score: 5 }] },
  { id: 2, candidateId: 2, positionId: 1, currentInterviewStep: 2, interviews: [{ score: 3 }] },
];

const mockCandidates = [
  { id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', applications: [mockApplications[0]] },
  { id: 2, firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', applications: [mockApplications[1]] },
];

describe('kanbanService', () => {
  describe('calculateAverageScore', () => {
    it('should return 0 for empty interviews array', () => {
      const result = calculateAverageScore([]);
      expect(result).toBe(0);
    });

    it('should return 0 for null/undefined interviews', () => {
      const result1 = calculateAverageScore(null);
      const result2 = calculateAverageScore(undefined);
      expect(result1).toBe(0);
      expect(result2).toBe(0);
    });

    it('should calculate correct average from interview scores', () => {
      const interviews = [{ score: 4 }, { score: 5 }, { score: 3 }];
      const result = calculateAverageScore(interviews);
      expect(result).toBe(4); // (4 + 5 + 3) / 3 = 4
    });

    it('should handle interviews with missing scores', () => {
      const interviews = [{ score: 4 }, { result: 'Pass' }, { score: 6 }];
      const result = calculateAverageScore(interviews);
      expect(result).toBeCloseTo(3.33); // (4 + 0 + 6) / 3 = 10/3 ≈ 3.33
    });
  });

  describe('organizeCandidatesByStage', () => {
    it('should organize candidates by their current interview step', () => {
      const result = organizeCandidatesByStage(mockInterviewSteps, mockApplications, mockCandidates);

      expect(result.length).toBe(4); // 4 stages
      expect(result[0].name).toBe('Applied');
      expect(result[0].candidates.length).toBe(1); // John Doe is in Applied (currentInterviewStep: 1, but interviewSteps[0].id: 1)
      expect(result[1].name).toBe('Screening');
      expect(result[1].candidates.length).toBe(1); // Jane Smith in Screening
      expect(result[2].name).toBe('Technical Interview');
      expect(result[2].candidates.length).toBe(0); // No candidates here
    });

    it('should sort stages by orderIndex', () => {
      const result = organizeCandidatesByStage(mockInterviewSteps, mockApplications, mockCandidates);

      expect(result[0].orderIndex).toBe(0);
      expect(result[1].orderIndex).toBe(1);
      expect(result[2].orderIndex).toBe(2);
      expect(result[3].orderIndex).toBe(3);
    });

    it('should include candidate average score', () => {
      const result = organizeCandidatesByStage(mockInterviewSteps, mockApplications, mockCandidates);

      // Find the Applied stage which should have John Doe
      const appliedStage = result.find(s => s.name === 'Applied');
      expect(appliedStage).toBeDefined();
      expect(appliedStage.candidates[0].averageScore).toBe(4.5); // (4 + 5) / 2
    });

    it('should handle candidates without applications', () => {
      const candidatesWithoutApps = [
        { id: 3, firstName: 'Bob', lastName: 'Wilson', email: 'bob@example.com' },
      ];

      const result = organizeCandidatesByStage(mockInterviewSteps, mockApplications, candidatesWithoutApps);

      // All stages should have 0 candidates since Bob has no applications
      result.forEach(stage => {
        expect(stage.candidates.length).toBe(0);
      });
    });

    it('should not duplicate candidates across stages', () => {
      const applicationsWithMultipleSteps = [
        { id: 1, candidateId: 1, positionId: 1, currentInterviewStep: 1, interviews: [] },
        { id: 2, candidateId: 1, positionId: 2, currentInterviewStep: 2, interviews: [] },
      ];

      const result = organizeCandidatesByStage(
        mockInterviewSteps,
        applicationsWithMultipleSteps,
        [{ id: 1, firstName: 'John', lastName: 'Doe', email: 'john@example.com', applications: applicationsWithMultipleSteps }]
      );

      // John should only appear once in Screening (first matching stage)
      const screeningStage = result.find(s => s.name === 'Screening');
      const technicalStage = result.find(s => s.name === 'Technical Interview');
      expect(screeningStage.candidates.length).toBe(1);
      expect(technicalStage.candidates.length).toBe(0);
    });
  });

  describe('fetchInterviewSteps', () => {
    it('should return mock data when API fails', async () => {
      // Since we're mocking axios and it will fail, it should return mock data
      const steps = await fetchInterviewSteps();
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toHaveProperty('id');
      expect(steps[0]).toHaveProperty('name');
      expect(steps[0]).toHaveProperty('orderIndex');
    });
  });

  describe('fetchCandidatesWithApplications', () => {
    it('should return mock data when API fails', async () => {
      // Since we're mocking axios and it will fail, it should return mock data
      const candidates = await fetchCandidatesWithApplications();
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0]).toHaveProperty('id');
      expect(candidates[0]).toHaveProperty('firstName');
      expect(candidates[0]).toHaveProperty('lastName');
      expect(candidates[0]).toHaveProperty('email');
    });
  });
});
