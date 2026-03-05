export default {
  template: `
    <q-input
      filled
      v-model="color"
      @update:model-value="(value) => emit('update:modelValue', value)"
    >
      <template v-slot:append>
        <q-icon name="colorize" class="cursor-pointer">
          <q-popup-proxy cover transition-show="scale" transition-hide="scale">
            <q-color v-model="color" @update:model-value="(value) => emit('update:modelValue', value)" />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  `,

  props: {
    modelValue: {
      type: String,
      default: 'black'
    }
  },

  emits: ['update:modelValue'],

  setup (props, { emit }) {
    const { ref, watch } = Vue
    const color = ref(props.modelValue)

    watch(() => props.modelValue, (newVal) => {
      color.value = newVal
    })

    return {
      color,
      emit
    }
  }
}
