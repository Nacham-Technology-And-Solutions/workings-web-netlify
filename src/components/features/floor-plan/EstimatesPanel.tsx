
import React, { useMemo } from 'react';
import type { EstimateCategory } from '@/types';

interface EstimatesPanelProps {
  estimates: EstimateCategory[];
}

const EstimatesPanel: React.FC<EstimatesPanelProps> = ({ estimates }) => {

  const grandTotal = useMemo(() => {
    return estimates.reduce((total, category) => {
      return total + category.items.reduce((catTotal, item) => catTotal + item.total, 0);
    }, 0);
  }, [estimates]);

  return (
    <aside className="w-96 bg-slate-950/50 p-4 flex flex-col border-l border-slate-800">
      <h2 className="text-lg font-bold text-slate-100 border-b border-slate-700 pb-2 mb-4">Cost Estimate</h2>
      <div className="flex-grow overflow-y-auto pr-2">
        {estimates.map(category => (
          <div key={category.name} className="mb-6">
            <h3 className="font-semibold text-sky-400 mb-2">{category.name}</h3>
            <div className="text-sm space-y-2">
              {category.items.map(item => (
                <div key={item.id} className="grid grid-cols-3 gap-2 items-center text-slate-400">
                  <span className="col-span-2 truncate">{item.description}</span>
                  <div className="text-right">
                    <span className="text-slate-200 font-mono">${item.total.toFixed(2)}</span>
                    <p className="text-xs text-slate-500">{item.quantity.toFixed(2)} {item.unit} @ ${item.unitCost.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t-2 border-slate-700 pt-4 mt-4">
        <div className="flex justify-between items-center text-xl">
          <span className="font-bold text-slate-100">Grand Total</span>
          <span className="font-bold text-sky-400 font-mono">${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </aside>
  );
};

export default EstimatesPanel;
