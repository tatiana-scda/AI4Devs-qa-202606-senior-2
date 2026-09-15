const axios = require('axios');
const Config = require('../config');

const { API_BASE_URL, DEFAULT_INTERVIEW_STEPS } = Config;

/**
 * Helper to create mock candidate with interviews
 * @private
 */
const createMockCandidate = (id, firstName, lastName, email, avgScore, appId, positionId, stepIndex, interviewScores) => ({
  id,
  firstName,
  lastName,
  email,
  averageScore: avgScore,
  applications: [{
    id: appId,
    candidateId: id,
    positionId,
    currentInterviewStep: stepIndex + 1,
    interviewStep: DEFAULT_INTERVIEW_STEPS[stepIndex],
    interviews: interviewScores.map(score => ({ score, result: 'Pass' })),
  }],
});

// Mock candidate data used as fallback when API fails
// This ensures the application can demonstrate functionality in development/demo mode
const MOCK_CANDIDATES = [
  createMockCandidate(1, 'John', 'Doe', 'john.doe@example.com', 4.5, 1, 1, 0, [4, 5]),
  createMockCandidate(2, 'Jane', 'Smith', 'jane.smith@example.com', 3.8, 2, 1, 1, [4, 4, 3]),
  createMockCandidate(3, 'Bob', 'Johnson', 'bob.johnson@example.com', 4.2, 3, 2, 2, [5, 4]),
  createMockCandidate(4, 'Alice', 'Williams', 'alice.williams@example.com', 4.7, 4, 1, 3, [5, 5, 4]),
  createMockCandidate(5, 'Charlie', 'Brown', 'charlie.brown@example.com', 3.5, 5, 3, 4, [4, 3]),
];

/**
 * Helper to create a backend error with preserved details
 * @param {Error} error - The original error from axios
 * @param {string} fallbackMessage - Fallback message if no error details are available
 * @returns {Error} Enhanced error with backend data preserved
 */
const createBackendError = (error, fallbackMessage) => {
  const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       fallbackMessage;
  
  const backendError = new Error(errorMessage);
  if (error.response?.data) {
    backendError.backendData = error.response.data;
    backendError.status = error.response.status;
  }
  return backendError;
};

/**
 * Calculate average score for a candidate based on their interviews
 * @param {Array} interviews - Array of interview objects with score property
 * @returns {number} Average score, or 0 if no interviews or invalid data
 */
const calculateAverageScore = (interviews) => {
  if (!interviews || interviews.length === 0) return 0;
  
  const total = interviews.reduce((sum, interview) => {
    return sum + (interview.score || 0);
  }, 0);
  
  return total / interviews.length;
};

/**
 * Organize candidates by their current interview step
 * @param {Array} interviewSteps - Array of interview step objects
 * @param {Array} applications - Array of application objects
 * @param {Array} candidates - Array of candidate objects
 * @returns {Array} Array of stage objects with candidates grouped by stage
 */
const organizeCandidatesByStage = (interviewSteps, applications, candidates) => {
  // Handle empty interview steps
  if (!interviewSteps || interviewSteps.length === 0) {
    return [];
  }

  // Create a map of stepId to step
  const stepMap = new Map();
  interviewSteps.forEach(step => {
    stepMap.set(step.id, step);
  });

  // Create stages from interview steps
  const stages = interviewSteps.map(step => ({
    id: step.id,
    name: step.name,
    orderIndex: step.orderIndex,
    candidates: [],
  }));

  // Group candidates by their current interview step
  candidates.forEach(candidate => {
    if (candidate.applications && candidate.applications.length > 0) {
      candidate.applications.forEach(app => {
        if (app.currentInterviewStep) {
          const step = stepMap.get(app.currentInterviewStep) || interviewSteps.find(s => s.id === app.currentInterviewStep);
          if (step) {
            const stage = stages.find(s => s.id === step.id);
            if (stage && !stage.candidates.some(c => c.id === candidate.id)) {
              // Calculate average score from interviews if available
              const avgScore = app.interviews ? calculateAverageScore(app.interviews) : (candidate.averageScore || 0);
              stage.candidates.push({
                ...candidate,
                applications: [{
                  ...app,
                  interviewStep: step,
                }],
                averageScore: avgScore,
              });
            }
          }
        }
      });
    }
  });

  // Sort stages by orderIndex
  return stages.sort((a, b) => a.orderIndex - b.orderIndex);
};

/**
 * Fetch all interview steps to determine hiring process stages
 * Falls back to default mock data if API fails
 * @returns {Promise<Array>} Promise resolving to array of interview step objects
 */
const fetchInterviewSteps = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/interview-steps`);
    return response.data;
  } catch (error) {
    // Intentional: Gracefully handle API failures by falling back to default data
    // This ensures the application remains functional even without backend connectivity
    console.warn('API call failed, using default interview steps data');
    return DEFAULT_INTERVIEW_STEPS;
  }
};

/**
 * Fetch all candidates with their applications and interview steps
 * Falls back to mock data if API fails
 * @returns {Promise<Array>} Promise resolving to array of candidate objects
 */
const fetchCandidatesWithApplications = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/candidates`);
    return response.data;
  } catch (error) {
    // Intentional: Gracefully handle API failures by falling back to mock data
    // This ensures the application can still demonstrate functionality in development/demo mode
    console.warn('API call failed, using mock candidates data');
    return MOCK_CANDIDATES;
  }
};

/**
 * Fetch all applications with their interview steps
 * @returns {Promise<Array>} Promise resolving to array of application objects
 */
const fetchApplicationsWithSteps = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/applications`);
    return response.data;
  } catch (error) {
    // Intentional: Gracefully handle API failures by falling back to empty array
    // Applications are optional data; an empty array allows the app to continue functioning
    console.warn('API call failed, using empty applications array');
    return [];
  }
};

/**
 * Update candidate's interview step (hiring process state)
 * Uses the PUT /candidates/:id endpoint
 * @param {number} candidateId - The candidate ID
 * @param {number} applicationId - The application ID
 * @param {number} interviewStepId - The new interview step ID
 * @returns {Promise<void>}
 * @throws {Error} If the API call fails, includes backend error details
 */
const updateCandidateInterviewStep = async (candidateId, applicationId, interviewStepId) => {
  try {
    await axios.put(`${API_BASE_URL}/candidates/${candidateId}`, {
      applicationId,
      currentInterviewStep: interviewStepId,
    });
  } catch (error) {
    // Intentional: Catch and re-throw with preserved backend error details
    // This ensures error information from the backend is not lost
    console.error('Backend error details:', error.response?.data);
    throw createBackendError(error, 'Unknown error updating candidate stage');
  }
};

/**
 * Get all candidates grouped by their hiring process state
 * @returns {Promise<Array>} Promise resolving to array of stage objects
 * @throws {Error} If data fetching fails, includes backend error details
 */
const getCandidatesByState = async () => {
  try {
    // Fetch data in parallel
    const [interviewSteps, applications, candidates] = await Promise.all([
      fetchInterviewSteps(),
      fetchApplicationsWithSteps(),
      fetchCandidatesWithApplications(),
    ]);

    // Check if we have interview steps defined
    if (!interviewSteps || interviewSteps.length === 0) {
      // Return empty array instead of throwing, so UI can handle it gracefully
      console.warn('No interview steps defined');
      return [];
    }

    return organizeCandidatesByStage(interviewSteps, applications, candidates);
  } catch (error) {
    // Intentional: Catch and re-throw with preserved backend error details
    // This ensures error information from the backend is not lost
    console.error('Error grouping candidates by state:', error);
    // Re-throw with preserved error details
    if (error.backendData) {
      throw error;
    }
    // Create new error with backend details using helper
    throw createBackendError(error, 'Unknown error');
  }
};

module.exports = {
  calculateAverageScore,
  organizeCandidatesByStage,
  fetchInterviewSteps,
  fetchCandidatesWithApplications,
  fetchApplicationsWithSteps,
  updateCandidateInterviewStep,
  getCandidatesByState,
  DEFAULT_INTERVIEW_STEPS,
};
