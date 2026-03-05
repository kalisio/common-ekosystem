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
        stroke: {},
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
        { shape: 'circle', color: 'red' },
        { shape: 'cross', color: 'red' },
        { shape: 'heart', color: 'red' },
        { shape: 'rect', color: 'green' },
        { shape: 'rounded-rect', color: 'green' },
        { shape: 'diamond', color: 'green' },
        { shape: 'triangle', color: 'blue' },
        { shape: 'triangle-down', color: 'blue' },
        { shape: 'triangle-right', color: 'blue' },
        { shape: 'triangle-left', color: 'blue' },
        { shape: 'marker-pin', color: 'purple' },
        { shape: 'square-pin', color: 'purple' },
        { shape: 'star4', color: 'lime' },
        { shape: 'star5', color: 'lime' },
        { shape: 'star6', color: 'lime' },
        { shape: 'pentagon', color: 'yellow' },
        { shape: 'hexagon', color: 'yellow' },
        { shape: 'polygon', color: 'yellow' },
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
        }
      ]
    }
  }
}
