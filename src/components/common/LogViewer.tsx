import React, { useState, useEffect, useMemo } from 'react';
import logger, { LogLevel, LogEntry } from '@/utils/logger';
import { CloseIcon } from '@/assets/icons/IconComponents';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    logger.getLogs().forEach(log => cats.add(log.category));
    return Array.from(cats).sort();
  }, [logs]);

  // Load logs
  const loadLogs = () => {
    const allLogs = logger.getLogs();
    setLogs(allLogs);
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    if (filterLevel !== 'ALL') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    if (filterCategory !== 'ALL') {
      filtered = filtered.filter(log => log.category === filterCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.category.toLowerCase().includes(query) ||
        JSON.stringify(log.data || {}).toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [logs, filterLevel, filterCategory, searchQuery]);

  // Auto-refresh
  useEffect(() => {
    if (!isOpen) return;

    loadLogs();

    if (autoRefresh) {
      const interval = setInterval(loadLogs, 1000); // Refresh every second
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh]);

  // Get log level color
  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.ERROR:
        return 'text-red-600 bg-red-50';
      case LogLevel.WARN:
        return 'text-yellow-600 bg-yellow-50';
      case LogLevel.INFO:
        return 'text-blue-600 bg-blue-50';
      case LogLevel.DEBUG:
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Export logs
  const handleExport = () => {
    const exportData = logger.exportLogs();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export as text
  const handleExportText = () => {
    const text = logger.getLogsAsText(
      filterLevel !== 'ALL' ? filterLevel : undefined,
      filterCategory !== 'ALL' ? filterCategory : undefined
    );
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear logs
  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      logger.clearLogs();
      loadLogs();
    }
  };

  // Get stats
  const stats = logger.getStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Application Logs</h2>
            <p className="text-sm text-gray-500">
              Total: {stats.total} | Errors: {stats.byLevel[LogLevel.ERROR]} | 
              Warnings: {stats.byLevel[LogLevel.WARN]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Export JSON
            </button>
            <button
              onClick={handleExportText}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Text
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'ALL')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Levels</option>
                <option value={LogLevel.ERROR}>Error</option>
                <option value={LogLevel.WARN}>Warning</option>
                <option value={LogLevel.INFO}>Info</option>
                <option value={LogLevel.DEBUG}>Debug</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No logs found</p>
              {logs.length > 0 && (
                <p className="text-sm mt-2">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border ${getLevelColor(log.level)} border-opacity-50`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold">{log.level}</span>
                        <span className="text-xs text-gray-500">{log.category}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium break-words">{log.message}</p>
                      {log.data && (
                        <pre className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                      {log.stack && (
                        <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto text-red-800">
                          {log.stack}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>
    </div>
  );
};

export default LogViewer;

