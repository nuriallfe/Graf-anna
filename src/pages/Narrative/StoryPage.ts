import { SceneAppPage } from '@grafana/scenes';
import { getStoryPageScene } from './StoryScene';
import { prefixRoute } from '../../utils/utils.routing';
import { ROUTES } from '../../constants';

export const storyPage = new SceneAppPage({
  title: 'Story page',
  url: prefixRoute(ROUTES.Narrative),
  subTitle:
    'This scene showcases a basic scene functionality, including query runner, variable and a custom scene object.',
  getScene: () => getStoryPageScene(),
});

