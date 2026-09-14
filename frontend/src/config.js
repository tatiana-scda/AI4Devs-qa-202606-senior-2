// Application configuration
// This file centralizes all configurable parameters for the application

const Config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3010',
  
  // Default interview steps (hiring process states)
  // These are used as fallback when API is not available
  DEFAULT_INTERVIEW_STEPS: [
    { id: 1, name: 'Applied', orderIndex: 0 },
    { id: 2, name: 'Screening', orderIndex: 1 },
    { id: 3, name: 'Technical Interview', orderIndex: 2 },
    { id: 4, name: 'HR Interview', orderIndex: 3 },
    { id: 5, name: 'Offer', orderIndex: 4 },
    { id: 6, name: 'Hired', orderIndex: 5 },
    { id: 7, name: 'Rejected', orderIndex: 6 },
  ],
  
  // Drag and Drop identifiers
  DND_TYPES: {
    CANDIDATE: 'candidate',
    STAGE: 'stage',
  },
  
  // Error messages
  ERROR_MESSAGES: {
    LOAD_FAILED: 'Failed to load candidates data. Please try again.',
    UPDATE_FAILED: 'Failed to update candidate stage. Please try again.',
    NO_STEPS_DEFINED: 'No hiring process steps have been defined yet. Please configure interview steps first.',
  },
};

module.exports = Config;
