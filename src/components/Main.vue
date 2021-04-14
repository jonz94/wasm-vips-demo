<template>
  <div class="grid content-center min-h-screen gap-8 justify-items-center">
    <h1 class="text-xl font-bold">
      Before: <code class="px-2 py-1 text-red-600 bg-red-200 rounded">.webp</code>
    </h1>
    <img src="/shirakami-fubuki.webp" class="w-72 h-72" />
    <button
      @click="run()"
      :disabled="!isVipsLoaded || isProcessing"
      class="w-24 h-12 text-lg text-white capitalize bg-blue-800 rounded disabled:bg-gray-700"
    >
      {{ isVipsLoaded ? 'run' : 'loading' }}
    </button>
    <h1 class="text-xl font-bold" :class="{ invisible: !imageUrl }">
      After: <code class="px-2 py-1 text-red-600 bg-red-200 rounded">.png</code>
    </h1>
    <img :src="imageUrl" class="w-72 h-72" :class="{ invisible: !imageUrl }" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'Main',

  setup() {
    const isVipsLoaded = ref(false);
    const imageUrl = ref<string>('');
    const isProcessing = ref(false);

    return { isVipsLoaded, isProcessing, imageUrl };
  },
  mounted() {
    this.check();
  },
  methods: {
    check() {
      if (!this?.$vips?.Image) {
        setTimeout(() => this.check(), 1000);
        return;
      }

      this.isVipsLoaded = true;
    },
    async run() {
      if (!this?.$vips?.Image) {
        console.error('vips is not loaded or is still loading');
        return;
      }

      this.isProcessing = true;

      // Load image to a buffer
      const originalImageBuffer = await fetch('shirakami-fubuki.webp')
        .then((response) => response.blob())
        .then((blob) => blob.arrayBuffer());

      // Create a vips image instance from a buffer
      const image = this.$vips.Image.newFromBuffer(originalImageBuffer);

      const resultImageBuffer = new Uint8Array(image.writeToBuffer('.png'));
      const blob = new Blob([resultImageBuffer], { type: 'image/png' });
      const url = URL.createObjectURL(blob);

      console.log(url);

      this.imageUrl = url;
      this.isProcessing = false;
    },
  },
});
</script>
