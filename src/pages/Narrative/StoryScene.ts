// src/pages/Narrative/StoryPage.ts
import {
  SceneQueryRunner,
  SceneFlexLayout,
  SceneFlexItem,
  PanelBuilders,
  SceneReactObject,
  SceneTimeRange,
  EmbeddedScene,
} from '@grafana/scenes';
import { DataSourceRef, DataFrame, LoadingState} from '@grafana/data';

// Corrected relative paths assuming StoryPage.ts is inside src/pages/Narrative/
import { CSV_DATASOURCE_UID } from '../../constants';
import { VisualComponent } from '../../components/VisualComponent/VisualComponent';
import { NarrativeComponent } from '../../components/NarrativeComponent/NarrativeComponent';

// Define the type for your CSV data source reference
const csvDatasourceRef: DataSourceRef = {
  uid: CSV_DATASOURCE_UID,
  type: 'csv',
};

interface NarrativeComponentProps {
  data?: DataFrame[]; // Pass the raw query result
  isLoading: boolean;
  country: string; // Pass the country being queried
}

interface VisualComponentProps {
  data?: DataFrame[]; // Pass the raw query result
  isLoading: boolean;
  country: string;
}

export function getStoryPageScene() {
  // --- Data Query Definition ---
  const countryToDisplay = 'Afghanistan';

  const queryRunner = new SceneQueryRunner({
    datasource: csvDatasourceRef,
    queries: [
      {
        refId: 'A',
        delimiter: ',',
        decimalSeparator: '.',
        header: true,
        ignoreUnknown: true,
        skipRows: 0,
        schema: [
          { name: 'Afghanistan', type: 'number' },
          { name: 'date', type: 'time' },
        ],
        path: '',
        queryParams: '',
        body: '',
        datasourceId: 2,
        intervalMs: 5000,
        maxDataPoints: 626,
      },
    ],
    maxDataPoints: 626,
  });

  // --- Visual Components ---
  const visualArea = new SceneReactObject<VisualComponentProps>({
    component: VisualComponent,
    key: 'visual-area',
    props: {
      data: undefined,
      isLoading: false,
      country: countryToDisplay,
    },
  });

  const narrativeArea = new SceneReactObject<NarrativeComponentProps>({
    component: NarrativeComponent,
    key: 'narrative-area',
    props: {
      data: undefined,
      isLoading: false,
      country: countryToDisplay,
    },
  });

  // Set up data subscription for visual area
  queryRunner.subscribeToState((newState) => {
    visualArea.setState({
      props: {
        data: newState.data?.series,
        isLoading:  newState.data?.state === LoadingState.Loading,
        country: countryToDisplay,
      },
    });
  });

  // Set up data subscription for narrative area
  queryRunner.subscribeToState((newState) => {
    narrativeArea.setState({
      props: {
        data: newState.data?.series,
        isLoading:  newState.data?.state === LoadingState.Loading,
        country: countryToDisplay,
      },
    });
  });

  const dataPanel = PanelBuilders.timeseries()
    .setTitle('Underlying Data (e.g., Forest Cover)')
    .setData(queryRunner)
    .build();

  // --- Layout Definition ---
  const pageLayout = new SceneFlexLayout({
    direction: 'column',
    children: [
      new SceneFlexItem({
        minHeight: 250,
        height: '35%',
        body: visualArea,
      }),
      new SceneFlexItem({
        minHeight: 150,
        height: '25%',
        body: narrativeArea,
      }),
      new SceneFlexItem({
        minHeight: 200,
        body: dataPanel,
      }),
    ],
  });

  // --- Page Definition ---
  return new EmbeddedScene({
    $data: queryRunner,
    body: pageLayout,
    $timeRange: new SceneTimeRange({ from: '1990-01-01T00:00:00Z', to: 'now' }),
  });
}

