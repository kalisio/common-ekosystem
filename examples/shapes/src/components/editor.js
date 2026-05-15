import { shapeFactory } from '../shape-factory.js'
import ShapeRenderer from './shape-renderer.js'
import ColorPicker from './color-picker.js'
import OpacitySlider from './opacity-slider.js'

export default {
  template: `
    <div class="column full-width">
      <div class="row justify-between items-center">
        <div class="q-pa-md relative-position col-7">
          <ShapeRenderer class="text-center" :params="params"></ShapeRenderer>
          <q-btn
            flat
            dense
            rounded
            icon="image"
            color="primary"
            class="absolute-top-right"
            @click="downloadAsPNG"
          >
        </div>
        <div class="q-pa-sm col-4">
          <q-select class="q-pa-sm" v-model="params.shape" :options="types" label="Type" />
          <div v-if="type !== 'donut' && type !== 'pie'">
            <ColorPicker v-model="color"></ColorPicker>
            <OpacitySlider v-model="opacity"></OpacitySlider>
          </div>
        </div>
      </div>
      <div class="q-pa-md relative-position bg-grey-2 text-subtitle2" style="white-space: pre-wrap;">
        {{ code }}
        <q-btn
          flat
          dense
          icon="content_copy"
          color="primary"
          class="absolute-top-right q-ma-sm"
          @click="copyToClipboard"
        >
      </div>
    </div>
  `,

  components: {
    ShapeRenderer,
    ColorPicker,
    OpacitySlider
  },

  setup () {
    const { ref, computed, watch } = Vue
    const { useQuasar, copyToClipboard: qCopyToClipboard, exportFile } = Quasar
    const $q = useQuasar()

    const params = ref({
      shape: 'circle',
      zoom: 3,
      color: 'orange',
      opacity: 1.0,
      stroke: { color: 'black', width: 2 }
    })
    const types = shapeFactory.list()
    const color = ref('orange')
    const opacity = ref(1.0)
    const slices = ref([
      { value: 25, label: 'slice A', color: 'red' },
      { value: 25, label: 'slice B', color: 'orange' },
      { value: 25, label: 'slice C', color: 'lime' },
      { value: 25, label: 'slice D', color: 'green' }
    ])

    const type = computed(() => {
      return params.value?.shape
    })
    const code = computed(() => {
      return JSON.stringify(params.value, null, 2)
    })

    watch(type, (value) => {
      if (value === 'pie' || value === 'donut') {
        params.value.slices = slices.value
        delete params.value.color
        delete params.value.opacity
      } else {
        delete params.value.slices
        params.value.color = color.value
        params.value.opacity = opacity.value
      }
    })
    watch(color, (value) => {
      if (params.value.color) params.value.color = value
    })
    watch(opacity, (value) => {
      if (params.value.opacity) params.value.opacity = value
    })

    function copyToClipboard () {
      qCopyToClipboard(code.value)
        .then(() => {
          $q.notify({
            message: 'Code copied',
            color: 'positive',
            icon: 'check',
            position: 'bottom',
            timeout: 1000
          })
        })
        .catch(() => {
          $q.notify({
            message: 'Error while copying code',
            color: 'negative',
            icon: 'error',
            position: 'bottom'
          })
        })
    }

    async function downloadAsPNG () {
      const shape = shapeFactory.build(params.value)
      if (!shape) return
      const pngDataUrl = await shape.toPNG()
      const response = await fetch(pngDataUrl)
      const blob = await response.blob()
      const status = exportFile('shape.png', blob, 'image/png')
      if (!status) {
        $q.notify({
          message: 'Error while exporting image',
          color: 'negative',
          icon: 'error',
          position: 'bottom'
        })
      }
    }

    return {
      params,
      types,
      type,
      color,
      opacity,
      slices,
      code,
      downloadAsPNG,
      copyToClipboard
    }
  }
}
