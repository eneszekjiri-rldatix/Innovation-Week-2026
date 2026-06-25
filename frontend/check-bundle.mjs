import fs from 'fs'
const s = fs.readFileSync('node_modules/@rld-engineering/base-camp-react/dist/base-camp-react.es.js', 'utf8')
console.log('react import', s.includes('from "react"'))
console.log('tanstack router', s.includes('@tanstack/react-router'))
console.log('tanstack query', s.includes('@tanstack/react-query'))
const importLine = s.match(/import J[^;]+from "[^"]+"/)
console.log('first import', importLine?.[0]?.slice(0, 200))
