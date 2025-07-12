// Type for a single Building, matching the GraphQL query
export interface Building {
  uuid: string;
  name: string | null;
  asset_type: string | null;
  asset_status: string | null;
  asset_active: boolean | null;
  asset_latitude: number | null;
  asset_longitude: number | null;
  created_at: string;
  updated_at: string;
}

// Type for a single WeatherData point
export interface WeatherData {
  id: string;
  asset_name: string | null;
  time_period: string;
  cloudiness: number | null;
  outdoor_temperature: number | null;
}

// The complete shape of the data returned by the GET_OVERVIEW_PAGE_DATA query
export interface OverviewPageData {
  overview: {
    buildings: Building[];
    weather: WeatherData[];
  };
}