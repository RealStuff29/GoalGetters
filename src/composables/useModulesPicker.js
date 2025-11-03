import { ref, watch } from 'vue'
import { modulesWithLabel, moduleIndex } from '@/constants/modules'


// - moduleObjects: the chip objects [{code,title,label}]
// - modules: normalised array of course codes ['IS113','IS216',...]

export function useModulesPicker() {

  const moduleObjects = ref([])
  const modules = ref([])

  const moduleQuery = ref('')
  const moduleSuggestions = ref([])

  // Keep modules in sync with chips (unique by course code)
  watch(
    moduleObjects,
    (objs) => {
      const uniqueCodes = Array.from(new Set((objs || []).map(o => o.code))).filter(Boolean)
      modules.value = uniqueCodes
    },
    { deep: true }
  )

  function searchModules(event) {
    const q = String(event.query || '').trim().toLowerCase()
    if (!q) {
      moduleSuggestions.value = modulesWithLabel
      return
    }
    moduleSuggestions.value = modulesWithLabel.filter(m =>
      m.code.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)
    )
  }

  // Add a suggestion chip (prevent duplicates)
  function addModuleOption(opt) {
    if (!opt?.code) return
    const exists = moduleObjects.value.some(o => o.code === opt.code)
    if (!exists) moduleObjects.value = [...moduleObjects.value, opt]
    moduleQuery.value = ''
  }

  // Add free-typed course code on Enter
  function addFreeTypedCourseCode() {
    const raw = String(moduleQuery.value || '').trim().toUpperCase()
    if (!raw) return
    const opt = moduleIndex[raw]
      ? { ...moduleIndex[raw], label: `${raw} ${moduleIndex[raw].title}` }
      : { code: raw, title: '', label: raw } // fallback for unknown course code
    addModuleOption(opt)
  }

  // Remove chip by index
  function removeModuleAt(idx) {
    const next = [...moduleObjects.value]
    next.splice(idx, 1)
    moduleObjects.value = next
  }

  return {
    // state
    moduleObjects, modules, moduleQuery, moduleSuggestions,
    // actions
    searchModules, addModuleOption, addFreeTypedCourseCode, removeModuleAt
  }
}
