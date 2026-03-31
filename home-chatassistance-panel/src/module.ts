import { PanelPlugin } from '@grafana/data';
import { SimplePanel } from './components/SimplePanel';


export const plugin = new PanelPlugin(SimplePanel);