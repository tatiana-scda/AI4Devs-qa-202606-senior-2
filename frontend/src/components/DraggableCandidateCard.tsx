import React from 'react';
import { Card } from 'react-bootstrap';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Config from '../config';

export interface CandidateCardProps {
  candidate: {
    id: number;
    firstName: string;
    lastName: string;
    averageScore?: number;
    applications?: Array<{
      id: number;
      interviewStep?: { id: number; name: string };
    }>;
  };
  onClick?: () => void;
}

const DraggableCandidateCard: React.FC<CandidateCardProps> = ({ candidate, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `candidate-${candidate.id}`,
    data: {
      candidateId: candidate.id,
      type: Config.DND_TYPES.CANDIDATE,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: 'transform 250ms ease',
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  // Get full name
  const fullName = `${candidate.firstName} ${candidate.lastName}`;

  // Format average score
  const displayScore = candidate.averageScore !== undefined && candidate.averageScore !== null
    ? candidate.averageScore.toFixed(1)
    : 'N/A';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="mb-2 shadow-sm"
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <Card.Body>
        <Card.Title className="mb-2">{fullName}</Card.Title>
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted">Score: {displayScore}</span>
          {candidate.applications?.[0]?.interviewStep?.name && (
            <small className="text-secondary">
              Current: {candidate.applications[0].interviewStep.name}
            </small>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default DraggableCandidateCard;
