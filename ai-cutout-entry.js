import { removeBackground } from '@imgly/background-removal';

const config = (device, onProgress) => ({
  publicPath: new URL('./ai-assets/', document.baseURI).href,
  model: 'small',
  device,
  proxyToWorker: false,
  output: { format: 'image/png', quality: 1 },
  progress: (key, current, total) => { onProgress?.(key, current, total); }
});

window.yixuRemoveBackground = async (input, onProgress) => {
  if (navigator.gpu) {
    try {
      return await removeBackground(input, config('gpu', onProgress));
    } catch (error) {
      console.warn('WebGPU cutout unavailable, retrying with CPU', error);
    }
  }
  return removeBackground(input, config('cpu', onProgress));
};

