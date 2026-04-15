import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', onClick }) => {
  const colorClasses = {
    blue: 'stat-card-blue',
    green: 'stat-card-green',
    yellow: 'stat-card-yellow',
    red: 'stat-card-red',
    purple: 'stat-card-purple'
  };

  return (
    <div 
      className={`stat-card ${colorClasses[color]} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="stat-card-content">
        <div className="stat-card-info">
          <h3 className="stat-card-title">{title}</h3>
          <p className="stat-card-value">{value}</p>
          {subtitle && <p className="stat-card-subtitle">{subtitle}</p>}
        </div>
        <div className="stat-card-icon">
          {Icon && <Icon size={32} />}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
