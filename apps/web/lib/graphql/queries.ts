import { gql } from '@apollo/client';

export const GET_OVERVIEW_PAGE_DATA = gql`
  query GetOverviewPage {
    overview {
      buildings {
        uuid
        name
        asset_type
        asset_status
        asset_active
        asset_latitude
        asset_longitude
        created_at
        updated_at
      }
      weather {
        id
        asset_name
        time_period
        cloudiness
        outdoor_temperature
      }
    }
  }
`;