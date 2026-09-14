import React from 'react';
import { Card, Col } from 'react-bootstrap';
import { useDroppable } from '@dnd-kit/core';
import DraggableCandidateCard from './DraggableCandidateCard';
import Config from '../config';

export interface StageColumnProps {
  stage: {
    id: number;
    name: string;
    orderIndex: number;
    candidates: Array<{
      id: number;
      firstName: string;
      lastName: string;
      averageScore?: number;
      applications?: Array<{
        id: number;
        interviewStep?: { id: number; name: string };
      }>;
    }>;
  };
  onCardClick: (candidate: any) => void;
}

const DroppableStageColumn: React.FC<StageColumnProps> = ({ stage, onCardClick }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `stage-${stage.id}`,
    data: {
      stageId: stage.id,
      type: Config.DND_TYPES.STAGE,
    },
  });

  const backgroundColor = isOver ? '#f8f9fa' : 'transparent';

  return (
    <Col md={3} sm={6} xs={12} className="mb-4">
      <Card
        ref={setNodeRef}
        className="h-100"
        style={{ backgroundColor }}
      >
        <Card.Header className="text-center font-weight-bold bg-light">
          {stage.name}
        </Card.Header>
        <Card.Body style={{ minHeight: '200px' }}>
          {stage.candidates.length === 0 ? (
            <div className="text-center text-muted py-4">
              <small>No candidates</small>
            </div>
          ) : (
            stage.candidates.map((candidate) => (
              <DraggableCandidateCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => onCardClick(candidate)}
              />
            ))
          )}
        </Card.Body>
      </Card>
    </Col>
  );
};

export default DroppableStageColumn;
