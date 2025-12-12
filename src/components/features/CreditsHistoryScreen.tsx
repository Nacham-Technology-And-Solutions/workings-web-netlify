import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon } from '@/assets/icons/IconComponents';
import { userService } from '@/services/api';
import { extractErrorMessage } from '@/utils/errorHandler';
import { normalizeApiResponse } from '@/utils/apiResponseHelper';
import ErrorMessage from '@/components/common/ErrorMessage';
import { useAuthStore } from '@/stores';

interface CreditsHistoryScreenProps {
  onBack: () => void;
}

interface CreditTransaction {
  id: number;
  amount: number;
  type: 'deduction' | 'credit' | 'subscription_renewal';
  description: string;
  createdAt: string;
  balanceAfter: number;
}

const CreditsHistoryScreen: React.FC<CreditsHistoryScreenProps> = ({ onBack }) => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCreditsHistory();
  }, []);

  const fetchCreditsHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!user?.id) {
        setError('User not found');
        return;
      }

      const response = await userService.getPointsHistory(user.id);
      
      // Debug: Log the raw response
      console.log('Raw credits history response:', response);
      
      const normalizedResponse = normalizeApiResponse(response);

      console.log('Normalized credits history response:', normalizedResponse);

      if (normalizedResponse.success && normalizedResponse.response) {
        // Handle nested response structure
        // API might return: { response: { transactions: [...], total: ..., limit: ..., offset: ... } }
        // Or: { response: { transactions: [...] } }
        const responseData = normalizedResponse.response as any;
        const transactionsData = responseData.transactions || responseData || [];
        const transactionsArray = Array.isArray(transactionsData) ? transactionsData : [];
        
        console.log('Extracted transactions:', transactionsArray);
        setTransactions(transactionsArray);
      } else {
        setError(normalizedResponse.message || 'Failed to load credits history');
      }
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(typeof errorMessage.message === 'string' 
        ? errorMessage.message 
        : 'Failed to load credits history');
      console.error('Error fetching credits history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'deduction':
        return 'Deduction';
      case 'credit':
        return 'Credit';
      case 'subscription_renewal':
        return 'Subscription Renewal';
      default:
        return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'deduction':
        return 'text-red-600 bg-red-50';
      case 'credit':
        return 'text-green-600 bg-green-50';
      case 'subscription_renewal':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="p-4 lg:p-6 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 lg:hover:bg-gray-100 lg:p-2 lg:rounded-lg lg:transition-colors"
              aria-label="Go back"
            >
              <ChevronLeftIcon />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 flex-1">
              Credits History
            </h1>
            <div className="text-right">
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.pointsBalance !== undefined ? user.pointsBalance.toLocaleString() : '0'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="px-4 lg:px-6 pt-4">
          <div className="max-w-4xl mx-auto">
            <ErrorMessage
              message={typeof error === 'string' ? error : 'An unexpected error occurred'}
              onDismiss={() => setError(null)}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                <p className="text-gray-500">Loading credits history...</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-900 mb-2">No transactions yet</p>
              <p className="text-sm text-gray-500">Your credits history will appear here once you start using credits.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Balance After
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.description || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          transaction.type === 'deduction' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'deduction' ? '-' : '+'}
                          {Math.abs(transaction.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {transaction.balanceAfter.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreditsHistoryScreen;

