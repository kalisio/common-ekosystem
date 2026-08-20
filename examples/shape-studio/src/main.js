import Gallery from './components/gallery.js'
import Editor from './components/editor.js'

const app = Vue.createApp({
  components: {
    Gallery,
    Editor
  },
  setup () {
    const { ref } = Vue
    const page = ref('gallery')

    return {
      page
    }
  }
})

app.use(Quasar)
app.mount('#q-app')
