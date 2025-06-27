// apps/web/components/dashboard/Pagination.tsx
"use client"; // Add this if it's not already there

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Don't render pagination if there's only one page or no items
  if (totalPages <= 1 && totalCount <= 0) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    // Use theme colors for text
    <div className="flex items-center justify-between text-sm text-text-medium mt-4">
      <div>
        Showing{' '}
        <span className="font-semibold text-text-light">
          {/* Handles displaying '0' if totalCount is 0 */}
          {totalCount === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}
        </span>{' '}
        to{' '}
        <span className="font-semibold text-text-light">
          {Math.min(currentPage * itemsPerPage, totalCount)}
        </span>{' '}
        of <span className="font-semibold text-text-light">{totalCount}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1 || totalCount === 0} {/* Disable if no items */}
          // Use theme colors for buttons
          className="p-2 rounded-md bg-background-dark hover:bg-background-dark/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-text-light">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages || totalCount === 0} {/* Disable if no items */}
          // Use theme colors for buttons
          className="p-2 rounded-md bg-background-dark hover:bg-background-dark/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;