// apps/web/lib/types.ts
export interface System {
  id: number;
  name: string;
  location: string;
  efficiency: number;
  status: 'optimal' | 'warning' | 'alert'; // This is the strict type
  type: string;
  lat: number;
  lng: number;
  temperature: number;
  power: number;
}