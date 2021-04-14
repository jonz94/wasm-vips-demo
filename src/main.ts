import { createApp } from 'vue';
import App from './App.vue';
import { WasmVipsPlugin } from './plugins/wasm-vips';
import './index.css';

const app = createApp(App);

app.use(WasmVipsPlugin);
app.mount('#app');
