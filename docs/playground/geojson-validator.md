---
aside: false
---

<script setup>
import { withBase } from 'vitepress'
</script>

<iframe
  :src="withBase('/examples/geojson-validator/index.html')"
  title="GeoJSon validator"
  class="example-frame"
/>

<style>
.VPDoc .container,
.VPDoc .content-container,
.VPDoc .content {
  max-width: 1400px !important;
}

.example-frame {
  width: 100%;
  height: 80vh;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
}
</style>