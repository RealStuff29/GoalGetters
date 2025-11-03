export const modules = [
  { code: "COR-IS1704", title: "Computational Thinking and Programming" },
  { code: "COR1305",    title: "Modeling & Data Analytics" },
  { code: "IS115",      title: "Algorithms and Programming" },
  { code: "IS215",      title: "Digital Business - Technologies and Transformation" },
  { code: "IS113",      title: "Web Application Development I" },
  { code: "IS114",      title: "Computing Fundamentals" },
  { code: "COR3001",    title: "Big Questions" },
  { code: "IS112",      title: "Data Management" },
  { code: "IS212",      title: "Software Project Management" },
  { code: "IS213",      title: "Enterprise Solution Development" },
  { code: "IS214",      title: "Enterprise Solution Management" },
  { code: "IS216",      title: "Web Application Development II" },
  { code: "IS217",      title: "Analytics Foundation" },
  { code: "CS440",      title: "Foundations of Cybersecurity" },
  { code: "CS204",      title: "Computer Networks" },
  { code: "CS205",      title: "Operating Systems" },
]

// with label + an index for quick lookups
export const modulesWithLabel = modules.map(m => ({ ...m, label: `${m.code} ${m.title}` }))
export const moduleIndex = Object.fromEntries(modules.map(m => [m.code, m]))
