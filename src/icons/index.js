import SvgIcon from '@/components/SvgIcon'

const svgModules = import.meta.glob('./svg/*.svg', {
  eager: true,
  query: '?raw',
  import: 'default'
})

function injectSprite() {
  const symbols = Object.entries(svgModules)
    .map(([path, raw]) => {
      const id = 'icon-' + path.replace(/^\.\/svg\/(.*)\.svg$/, '$1')
      let content = raw.replace(/<svg([^>]*)>/, `<symbol id="${id}"$1>`)
      content = content.replace(/<\/svg>/, '</symbol>')
      return content
    })
    .join('')

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.style.position = 'absolute'
  svg.style.width = '0'
  svg.style.height = '0'
  svg.innerHTML = symbols
  document.body.appendChild(svg)
}

export default function installIcons(app) {
  app.component('svg-icon', SvgIcon)
  if (document.body) {
    injectSprite()
  } else {
    document.addEventListener('DOMContentLoaded', injectSprite)
  }
}
