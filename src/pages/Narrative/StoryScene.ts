// src/pages/Narrative/StoryPage.ts
import {
    SceneQueryRunner,
    SceneFlexLayout,
    SceneFlexItem,
    PanelBuilders,
    SceneReactObject,
    SceneTimeRange,
    EmbeddedScene
    // Removed SceneObjectBase, SceneObjectState
  } from '@grafana/scenes';
  import { DataSourceRef } from '@grafana/data';
  
  // Corrected relative paths assuming StoryPage.ts is inside src/pages/Narrative/
  import { CSV_DATASOURCE_UID } from '../../constants';
  import { VisualComponent } from '../../components/VisualComponent/VisualComponent';
  import { NarrativeComponent } from '../../components/NarrativeComponent/NarrativeComponent';
  
  // Define the type for your CSV data source reference
  const csvDatasourceRef: DataSourceRef = {
    uid: CSV_DATASOURCE_UID,
    type: 'csv',
  };
  
  // You don't need this interface if you are not extending SceneAppPage into a custom class
  // interface StoryPageSceneState extends SceneAppPageState {}
  
  export function getStoryPageScene() {
    // --- Data Query Definition ---
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
            { name: 'Forest area (sq. km)', type: 'number' },
            { name: 'country', type: 'string' },
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
    const visualArea = new SceneReactObject({
      component: VisualComponent,
      key: 'visual-area',
    });
  
    const narrativeArea = new SceneReactObject({
      component: NarrativeComponent,
      key: 'narrative-area',
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
    // Remove the type argument <StoryPageSceneState>
    return new EmbeddedScene({
      $data: queryRunner,
      body: pageLayout,
      $timeRange: new SceneTimeRange(),
    });
  }
