import { Plugin } from 'vue';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $vips: any;
  }
}

async function injectScript(scriptSrc = '/lib/vips.js') {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}

export interface WasmVipsPluginOptions {
  scriptSrc?: string;
  debug?: boolean;
}

export const WasmVipsPlugin: Plugin = {
  install: (app, options: WasmVipsPluginOptions) => {
    const log = options?.debug === true ? console.log : () => {};
    log({ options });

    (async () => {
      await injectScript(options?.scriptSrc);
      app.config.globalProperties.$vips = await (window as any).Vips();
      log('vips.js is loaded via plugin');
    })();
  },
};
