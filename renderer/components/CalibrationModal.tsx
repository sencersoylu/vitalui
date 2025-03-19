import React from 'react';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: number;
  status: string;
  onCancel: () => void;
}

const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen,
  onClose,
  progress,
  status,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="calibration-modal">
        <h2>Calibration in Progress</h2>
        <p className="calibration-status">{status}</p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="progress-percentage">{progress}%</p>
        <button className="cancel-button" onClick={onCancel}>
          Cancel
        </button>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10;
          }
          
          .calibration-modal {
            background-color: white;
            border-radius: 16px;
            padding: 40px;
            width: 500px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            text-align: center;
          }
          
          .calibration-modal h2 {
            font-family: 'Plus Jakarta Sans';
            font-weight: 700;
            font-size: 28px;
            color: rgb(26, 32, 39);
            margin-bottom: 20px;
          }
          
          .calibration-status {
            font-family: 'Plus Jakarta Sans';
            font-size: 18px;
            color: rgb(74, 74, 74);
            margin-bottom: 30px;
          }
          
          .progress-container {
            width: 100%;
            height: 20px;
            background-color: rgba(36, 78, 126, 0.1);
            border-radius: 10px;
            margin-bottom: 10px;
            overflow: hidden;
          }
          
          .progress-bar {
            height: 100%;
            background-color: rgb(33, 116, 212);
            transition: width 0.3s ease;
          }
          
          .progress-percentage {
            font-family: 'Plus Jakarta Sans';
            font-size: 18px;
            font-weight: 600;
            color: rgb(33, 116, 212);
            margin-bottom: 30px;
          }
          
          .cancel-button {
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            background-color: rgb(240, 240, 240);
            color: rgb(74, 74, 74);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Plus Jakarta Sans';
            transition: background-color 0.3s;
          }
          
          .cancel-button:hover {
            background-color: rgb(220, 220, 220);
          }
        `}</style>
      </div>
    </div>
  );
};

export default CalibrationModal; 