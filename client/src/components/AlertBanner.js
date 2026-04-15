import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const AlertBanner = ({ alerts, onDismiss }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="alert-banner-container">
      {alerts.map((alert, index) => (
        <div key={index} className={`alert-banner alert-${alert.type || 'warning'}`}>
          <AlertTriangle size={20} />
          <span className="alert-message">{alert.message}</span>
          {onDismiss && (
            <button className="alert-dismiss" onClick={() => onDismiss(index)}>
              <X size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default AlertBanner;
