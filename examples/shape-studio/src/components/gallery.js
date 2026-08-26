import ShapeRenderer from './shape-renderer.js'

export default {
  template: `
    <div class="row full-width justify-center items-center">
      <template v-for="shape in shapes" :key="shape.shape">
        <ShapeRenderer class="q-pa-md col-xs-4 col-sm-3 col-md-2 col-lg-1 text-center" :params="decoratedShape(shape)"></ShapeRenderer>
      </template>
    <div>
  `,

  components: {
    ShapeRenderer
  },

  setup () {
    function decoratedShape (shape) {
      return {
        ...shape,
        label: shape.shape,
        radius: 30,
        stroke: shape.stroke ? shape.stroke : {},
        text: {
          label: shape.shape,
          size: 12,
          transform: { translate: [50, 130] }
        }
      }
    }

    return {
      decoratedShape,
      shapes: [
        { shape: 'circle', color: 'red', icon: { url: 'https://raw.githubusercontent.com/kalisio/kalisioscope/refs/heads/gh-pages/kalisio/kalisio-icon-dark-256x256.png' } },
        { shape: 'cross', color: 'red' },
        { shape: 'x', color: 'red' },
        { shape: 'heart', color: 'red', stroke: { color: 'green', width: 2 } },
        { shape: 'flag', color: 'red' },
        { shape: 'target', color: 'grey', stroke: { color: 'red', width: 2 } },
        { shape: 'compass', color: 'grey' },
        { shape: 'rect', color: 'green' },
        { shape: 'rounded-rect', color: 'green' },
        { shape: 'diamond', color: 'green' },
        { shape: 'triangle', color: 'blue' },
        { shape: 'triangle-down', color: 'blue' },
        { shape: 'triangle-right', color: 'blue' },
        { shape: 'triangle-left', color: 'blue' },
        { shape: 'marker-pin', color: 'purple' },
        { shape: 'square-pin', color: 'purple' },
        { shape: 'star-4', color: 'lime' },
        { shape: 'star-5', color: 'lime' },
        { shape: 'star-6', color: 'lime' },
        { shape: 'pentagon', color: 'yellow' },
        { shape: 'hexagon', color: 'yellow' },
        { shape: 'octagon', color: 'yellow' },
        { shape: 'polygon', color: 'yellow' },
        { shape: 'polyline', color: 'orange' },
        {
          shape: 'donut',
          slices: [
            { value: 10, label: 'slice a', color: 'red' },
            { value: 25, label: 'slice b', color: 'green' },
            { value: 18, label: 'slice c', color: 'blue' }
          ]
        },
        {
          shape: 'pie',
          slices: [
            { value: 12, label: 'slice a', color: 'red' },
            { value: 30, label: 'slice b', color: 'green' },
            { value: 10, label: 'slice c', color: 'blue' }
          ]
        },
        { shape: 'wind-barb', speed: 0 },
        { shape: 'wind-barb', speed: 5, direction: 0 },
        { shape: 'wind-barb', speed: 10, direction: 15 },
        { shape: 'wind-barb', speed: 15, direction: 30 },
        { shape: 'wind-barb', speed: 20, direction: 45 },
        { shape: 'wind-barb', speed: 25, direction: 60 },
        { shape: 'wind-barb', speed: 30, direction: 75 },
        { shape: 'wind-barb', speed: 35, direction: 90 },
        { shape: 'wind-barb', speed: 40, direction: 105 },
        { shape: 'wind-barb', speed: 45, direction: 120 },
        { shape: 'wind-barb', speed: 50, direction: 135 },
        { shape: 'wind-barb', speed: 55, direction: 150 },
        { shape: 'wind-barb', speed: 60, direction: 165 },
        { shape: 'wind-barb', speed: 65, direction: 180 },
        { shape: 'wind-barb', speed: 70, direction: 195 },
        { shape: 'wind-barb', speed: 75, direction: 210 },
        { shape: 'wind-barb', speed: 80, direction: 225 },
        { shape: 'wind-barb', speed: 85, direction: 240 },
        { shape: 'wind-barb', speed: 90, direction: 255 },
        { shape: 'wind-barb', speed: 95, direction: 270 },
        { shape: 'wind-barb', speed: 100, direction: 285 },
        { shape: 'wind-barb', speed: 105, direction: 300 },
        { shape: 'wind-barb', speed: 110, direction: 315 },
        { shape: 'wind-barb', speed: 115, direction: 330 },
        { shape: 'wind-barb', speed: 120, direction: 345 },
        { shape: 'wind-barb', speed: 125, direction: 345 },
        { shape: 'wind-barb', speed: 130, direction: 360 },
        { shape: 'wind-barb', speed: 135, direction: 15 },
        { shape: 'wind-barb', speed: 140, direction: 30 },
        { shape: 'wind-barb', speed: 145, direction: 45 },
        { shape: 'wind-barb', speed: 150, direction: 0 }
      ]
    }
  }
}
