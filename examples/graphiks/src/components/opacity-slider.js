export default {
  template: `
    <div class="q-pa-sm">
      <span class="text-caption">Opacity</span>
      <q-slider
        v-model="opacity"
        :min="0"
        :max="1.0"
        :step="0.1"
        @update:model-value="(value) => emit('update:modelValue', value)"
      >
      </q-slider>
    </div>
  `,

  props: {
    modelValue: {
      type: Number,
      default: 1.0
    }
  },

  emits: ['update:modelValue'],

  setup (props, { emit }) {
    const { ref, watch } = Vue
    const opacity = ref(props.modelValue)

    watch(() => props.modelValue, (value) => {
      opacity.value = value
    })

    return {
      opacity,
      emit
    }
  }
}
