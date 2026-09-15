import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Button, Spinner, Alert } from 'react-bootstrap';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import DroppableStageColumn from './DroppableStageColumn';
import {
  Stage,
  getCandidatesByState,
  updateCandidateInterviewStep,
} from '../services/kanbanService';
import Config from '../config';

interface DroppableData {
  candidateId?: number;
  stageId?: number;
}

interface DragData extends DroppableData {
  type: string;
}

const CandidatesKanbanBoard: React.FC = () => {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map to store candidate to application mapping for quick lookup
  const [candidateApplications, setCandidateApplications] = useState<Map<number, { applicationId: number; currentStepId: number }>>(new Map());

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const stagesData = await getCandidatesByState();
        setStages(stagesData);
        
        // Build candidate to application mapping
        const appMap = new Map<number, { applicationId: number; currentStepId: number }>();
        for (const stage of stagesData) {
          for (const candidate of stage.candidates) {
            if (candidate.applications) {
              for (const app of candidate.applications) {
                appMap.set(candidate.id, {
                  applicationId: app.id,
                  currentStepId: app.interviewStep?.id || 0,
                });
              }
            }
          }
        }
        setCandidateApplications(appMap);
      } catch (err) {
        // Preserve backend error details if available
        const errorMessage = err.backendData ? 
          `${Config.ERROR_MESSAGES.LOAD_FAILED} (${err.message})` :
          Config.ERROR_MESSAGES.LOAD_FAILED;
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to move candidate between stages in the UI
  const moveCandidateInStages = useCallback((prevStages: Stage[], candidateId: number, newStageId: number) => {
    const newStages = [...prevStages];
    let candidateToMove: any = null;
    
    // Find and remove candidate from current stage
    for (const stage of newStages) {
      const idx = stage.candidates.findIndex(c => c.id === candidateId);
      if (idx !== -1) {
        candidateToMove = { ...stage.candidates[idx] };
        stage.candidates.splice(idx, 1);
        break;
      }
    }
    
    if (!candidateToMove) return newStages;
    
    const targetStage = newStages.find(s => s.id === newStageId);
    if (!targetStage) return newStages;
    
    candidateToMove = {
      ...candidateToMove,
      applications: [{
        ...candidateToMove.applications?.[0],
        interviewStep: { id: newStageId, name: targetStage.name },
      }],
    };
    targetStage.candidates.push(candidateToMove);
    
    return newStages;
  }, []);

  // Handle drag end event
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Early returns for invalid states
    if (!over) return;
    
    const activeData = active.data.current as DragData;
    const overData = over.data.current as DragData;
    
    if (activeData.type !== Config.DND_TYPES.CANDIDATE || overData.type !== Config.DND_TYPES.STAGE) return;
    
    const candidateId = activeData.candidateId;
    const newStageId = overData.stageId;
    
    if (!candidateId || !newStageId) return;
    
    const appInfo = candidateApplications.get(candidateId);
    if (!appInfo) return;
    
    await handleStageUpdate(candidateId, appInfo, newStageId);
  }, [candidateApplications, moveCandidateInStages, handleStageUpdate]);

  // Helper to handle stage update and state management
  const handleStageUpdate = useCallback(async (candidateId: number, appInfo: { applicationId: number; currentStepId: number }, newStageId: number) => {
    try {
      await updateCandidateInterviewStep(candidateId, appInfo.applicationId, newStageId);
      
      setStages(prevStages => moveCandidateInStages(prevStages, candidateId, newStageId));
      
      setCandidateApplications(prev => {
        const newMap = new Map(prev);
        newMap.set(candidateId, {
          applicationId: appInfo.applicationId,
          currentStepId: newStageId,
        });
        return newMap;
      });
    } catch (err) {
      console.error('Error updating candidate stage:', err);
      const errorMessage = err.backendData ?
        `${Config.ERROR_MESSAGES.UPDATE_FAILED} (${err.message})` :
        Config.ERROR_MESSAGES.UPDATE_FAILED;
      setError(errorMessage);
      const stagesData = await getCandidatesByState();
      setStages(stagesData);
    }
  }, [moveCandidateInStages]);

  // Handle card click
  const handleCardClick = useCallback((candidate: any) => {
    // For now, just log the candidate
    console.log('Candidate clicked:', candidate);
    // Could navigate to candidate details page if available
    // navigate(`/candidates/${candidate.id}`);
  }, [navigate]);

  // Sort stages by orderIndex for consistent display
  const sortedStages = [...stages].sort((a, b) => a.orderIndex - b.orderIndex);

  if (isLoading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" />
        <span className="ms-2">Loading candidates...</span>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="px-4 py-4">
      <div className="d-flex align-items-center mb-4">
        <Button
          variant="link"
          onClick={() => navigate('/positions')}
          className="me-3 p-0"
          aria-label="Back to positions"
        >
          <span className="fs-4">←</span>
        </Button>
        <h1 className="mb-0">Candidates by Hiring Process State</h1>
      </div>
      
      <p className="text-muted mb-4">
        Drag and drop candidates between columns to update their hiring process state
      </p>

      {sortedStages.length === 0 ? (
        <Alert variant="info">{Config.ERROR_MESSAGES.NO_STEPS_DEFINED}</Alert>
      ) : (
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          <Row>
            {sortedStages.map((stage) => (
              <DroppableStageColumn
                key={stage.id}
                stage={stage}
                onCardClick={handleCardClick}
              />
            ))}
          </Row>
        </DndContext>
      )}
    </Container>
  );
};

export default CandidatesKanbanBoard;
