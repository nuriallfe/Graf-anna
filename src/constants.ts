import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Home = 'home',
  WithTabs = 'page-with-tabs',
  WithDrilldown = 'page-with-drilldown',
  HelloWorld = 'hello-world',
  Narrative = 'narrative',
}

export const DATASOURCE_REF = {
  uid: 'gdev-testdata',
  type: 'testdata',
};


export const CSV_DATASOURCE_UID = 'aekridgcqdaf4e';

export const LLM_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

export const LLM_API_KEY = ''; 

export const LLM_MODEL = 'gpt-3.5-turbo';

