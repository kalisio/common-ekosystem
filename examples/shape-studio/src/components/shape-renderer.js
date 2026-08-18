import { shapeFactory } from '../shape-factory.js'

export default {
  template: `
    <div v-html="svg"></div>
  `,

  props: {
    params: {
      type: Object,
      required: true
    }
  },

  setup (props) {
    // Data
    const { computed } = Vue
    const svg = computed(() => {
      const shape = shapeFactory.build(props.params)
      if (!shape) return
      return shape.toSVG()
    })

    return {
      svg
    }
  }
}
