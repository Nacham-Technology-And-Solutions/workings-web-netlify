import React from 'react';
import SubscriptionPlansContent from '@/components/features/SubscriptionPlansContent';

interface SubscriptionPlanScreenProps {
  onBack: () => void;
}

const SubscriptionPlanScreen: React.FC<SubscriptionPlanScreenProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-screen bg-white">
      <SubscriptionPlansContent onBack={onBack} />
    </div>
  );
};

export default SubscriptionPlanScreen;

