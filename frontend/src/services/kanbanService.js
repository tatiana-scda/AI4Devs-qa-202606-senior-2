const axios = require('axios');
const Config = require('../config');

const { API_BASE_URL, DEFAULT_INTERVIEW_STEPS } = Config;

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
    console.warn('API call failed, using mock candidates data');
    // Mock candidates with random interview steps for demonstration
    return [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        averageScore: 4.5,
        applications: [{
          id: 1,
          candidateId: 1,
          positionId: 1,
          currentInterviewStep: 1,
          interviewStep: DEFAULT_INTERVIEW_STEPS[0],
          interviews: [
            { score: 4, result: 'Pass' },
            { score: 5, result: 'Pass' },
          ],
        }],
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        averageScore: 3.8,
        applications: [{
          id: 2,
          candidateId: 2,
          positionId: 1,
          currentInterviewStep: 2,
          interviewStep: DEFAULT_INTERVIEW_STEPS[1],
          interviews: [
            { score: 4, result: 'Pass' },
            { score: 4, result: 'Pass' },
            { score: 3, result: 'Pass' },
          ],
        }],
      },
      {
        id: 3,
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        averageScore: 4.2,
        applications: [{
          id: 3,
          candidateId: 3,
          positionId: 2,
          currentInterviewStep: 3,
          interviewStep: DEFAULT_INTERVIEW_STEPS[2],
          interviews: [
            { score: 5, result: 'Pass' },
            { score: 4, result: 'Pass' },
          ],
        }],
      },
      {
        id: 4,
        firstName: 'Alice',
        lastName: 'Williams',
        email: 'alice.williams@example.com',
        averageScore: 4.7,
        applications: [{
          id: 4,
          candidateId: 4,
          positionId: 1,
          currentInterviewStep: 4,
          interviewStep: DEFAULT_INTERVIEW_STEPS[3],
          interviews: [
            { score: 5, result: 'Pass' },
            { score: 5, result: 'Pass' },
            { score: 4, result: 'Pass' },
          ],
        }],
      },
      {
        id: 5,
        firstName: 'Charlie',
        lastName: 'Brown',
        email: 'charlie.brown@example.com',
        averageScore: 3.5,
        applications: [{
          id: 5,
          candidateId: 5,
          positionId: 3,
          currentInterviewStep: 5,
          interviewStep: DEFAULT_INTERVIEW_STEPS[4],
          interviews: [
            { score: 4, result: 'Pass' },
            { score: 3, result: 'Pass' },
          ],
        }],
      },
    ];
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
    // Preserve backend error details
    const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Unknown error updating candidate stage';
    
    const backendError = new Error(errorMessage);
    // Add additional context from the error response if available
    if (error.response?.data) {
      backendError.backendData = error.response.data;
      backendError.status = error.response.status;
    }
    
    console.error('Backend error details:', error.response?.data);
    throw backendError;
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
    console.error('Error grouping candidates by state:', error);
    // Re-throw with preserved error details
    if (error.backendData) {
      throw error;
    }
    // Create new error with backend details if available
    const errorMessage = error.response?.data?.message || 
                       error.response?.data?.error ||
                       error.message ||
                       'Unknown error';
    const backendError = new Error(errorMessage);
    if (error.response?.data) {
      backendError.backendData = error.response.data;
      backendError.status = error.response.status;
    }
    throw backendError;
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
