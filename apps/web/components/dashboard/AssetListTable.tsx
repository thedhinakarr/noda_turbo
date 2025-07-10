// apps/web/components/dashboard/AssetListTable.tsx
"use client";

import React, { useState } from 'react';
import { System } from '@/lib/graphql/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/ui/card';
import { cn } from '@/lib/utils';
// --- NEW IMPORTS from shadcn/ui table ---
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // Assuming shadcn-ui adds to components/ui/table.tsx
// --- END NEW IMPORTS ---
import { ChevronLeft, ChevronRight } from 'lucide-react'; // For pagination arrows

interface AssetListTableProps {
  systems: System[];
}

// Helper to map numeric assetStatus to descriptive string and color
const getStatusDisplay = (status: string | null) => {
  // Assuming '1' means good/optimal, '0' means bad/alert, other means warning/unknown
  switch (status) {
    case '1': return { text: 'Optimal', color: 'text-accent-green' };
    case '0': return { text: 'Alert', color: 'text-accent-red' };
    default: return { text: 'Warning', color: 'text-accent-yellow' }; // Use warning for undefined/other
  }
};

const AssetListTable: React.FC<AssetListTableProps> = ({ systems }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // As seen in your design pagination (1-5/8)

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSystems = systems.slice(startIndex, endIndex);
  const totalPages = Math.ceil(systems.length / itemsPerPage);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  if (systems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-text-primary">Asset List</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center text-text-secondary">
          No assets available.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-text-primary">Asset List</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <div className="overflow-x-auto">
          {/* Using shadcn/ui Table components */}
          <Table>
            <TableHeader className="bg-background-dark/50"> {/* Apply dark background to header */}
              <TableRow>
                <TableHead className="px-6 py-3 text-text-secondary">Name</TableHead>
                <TableHead className="px-6 py-3 text-text-secondary">Status</TableHead>
                <TableHead className="px-6 py-3 text-text-secondary">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSystems.map((system) => {
                const status = getStatusDisplay(system.assetStatus);
                return (
                  <TableRow key={system.uuid} className="hover:bg-background-dark border-border"> {/* border-b is handled by TableRow */}
                    <TableCell className="px-6 py-3 font-medium text-text-primary whitespace-nowrap">
                      {system.name || 'N/A'}
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", status.color)}>
                        {status.text}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-3">
                      {system.assetActive ? (
                        <span className="text-accent-green">Yes</span>
                      ) : (
                        <span className="text-accent-red">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {/* Pagination */}
      <div className="px-6 py-4 border-t border-border flex justify-between items-center text-sm text-text-secondary">
        <span>{startIndex + 1}-{Math.min(endIndex, systems.length)}/{systems.length}</span>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="p-2 rounded-md bg-background-dark hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md bg-background-dark hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

export default AssetListTable;