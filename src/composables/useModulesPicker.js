import { ref, watch } from 'vue'
import { modulesWithLabel, moduleIndex } from '@/constants/modules'


// - selectedModuleChips: the chip objects [{code,title,label}]
// - modules: normalised array of course codes ['IS113','IS216',...]

export function useModulesPicker() {

  const selectedModuleChips = ref([])
  const selectedModuleCodes = ref([])
  const moduleSearchQuery = ref('')
  const moduleSuggestionOptions = ref([])


  function normalizeValidModuleCodes(codes) {
     const seen = new Set()
     return (codes || [])
       .map(c => String(c || '').trim().toUpperCase())
       .filter(code => {
         if (!code || !moduleIndex[code] || seen.has(code)) return false
         seen.add(code)
         return true
       })
   }

  // Keep modules in sync with chips (unique by course code)
  watch(
    selectedModuleChips,
    (objs) => {
      const uniqueCodes = Array.from(new Set((objs || []).map(o => (o?.code || '').toUpperCase()))).filter(Boolean)
      selectedModuleCodes.value = normalizeValidModuleCodes(uniqueCodes)
    },
    { deep: true }
  )

  function fetchModuleSuggestions(event) {
    const q = String(event.query || '').trim().toLowerCase()
    if (!q) {
      moduleSuggestionOptions.value = modulesWithLabel
      return
    }
    moduleSuggestionOptions.value = modulesWithLabel.filter(m =>
      m.code.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)
    )
  }

  // Add a suggestion chip (prevent duplicates)
  function addModuleFromSuggestion(opt) {
    if (!opt?.code) return
     const code = String(opt.code).toUpperCase()
     if (!moduleIndex[code]) return
    const exists = selectedModuleChips.value.some(o => o.code === code)
    if (!exists) selectedModuleChips.value = [...selectedModuleChips.value, { ...moduleIndex[code], label: `${code} ${moduleIndex[code].title}` }]
    moduleSearchQuery.value = ''
  }

  function addModuleFromInput() {
    const raw = String(moduleSearchQuery.value || '').trim().toUpperCase()
    if (!raw) return { ok: false }
     if (!moduleIndex[raw]) {
       return { ok: false, code: raw }
     }
    addModuleFromSuggestion({ code: raw })
    return { ok: true, code: raw }
  }

  // Remove chip by index
  function removeModuleByIndex(idx) {
    const next = [...selectedModuleChips.value]
    next.splice(idx, 1)
    selectedModuleChips.value = next
  }

  return {
    selectedModuleChips, selectedModuleCodes, moduleSearchQuery, moduleSuggestionOptions,
    fetchModuleSuggestions, addModuleFromSuggestion, addModuleFromInput, removeModuleByIndex,
    normalizeValidModuleCodes,
  }
}
