// FILE: apps/web/components/dashboard/AssetListTable.tsx
// This component now uses the precise 'System' type for its props.

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { System } from '@/lib/graphql/types'; // Using the precise System type

interface AssetListTableProps {
  systems: System[];
}

export default function AssetListTable({ systems }: AssetListTableProps) {
  if (!systems || systems.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-secondary">
        No system data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table className='bg-background-card rounded-sm'>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-background- border-b-border">
            <TableHead>System Name</TableHead>
            <TableHead>Efficiency</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Active</TableHead>
            {/* Add other relevant columns as needed */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {systems.map((system) => (
            <TableRow key={system.id} id={`asset-row-${system.id}`} className="cursor-pointer hover:bg-background-highlight border-b-border">
              <TableCell className="font-medium text-text-primary">{system.name || 'N/A'}</TableCell>
              <TableCell className="font-mono text-text-primary">
                {system.kpis?.efficiency?.toFixed(1) || 'N/A'}%
              </TableCell>
              <TableCell className="font-mono text-text-primary">
                1
              </TableCell>
              <TableCell className="font-mono text-text-primary">
                true
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}