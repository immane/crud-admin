<template>
  <div class="detail-json">
    <div v-if="parsed === null" class="detail-json__empty">-</div>
    <template v-else>
      <div class="detail-json__header">
        <span class="detail-json__type">{{ typeLabel }}</span>
        <span class="detail-json__size">{{ sizeLabel }}</span>
        <el-button
          v-if="lines.length > collapseLimit"
          type="text"
          size="mini"
          icon="el-icon-arrow-down"
          class="detail-json__toggle"
          @click="expanded = !expanded"
        >
          {{ expanded ? '收起' : `展开全部 (${lines.length} 行)` }}
        </el-button>
      </div>
      <pre class="detail-json__code"><code><template v-for="(line, idx) in visibleLines" :key="idx"><span :class="syntaxClass(line)">{{ line }}</span><br></template></code></pre>
    </template>
  </div>
</template>

<script>
export default {
  props: {
    value: { type: [String, Number, Boolean, Object, Array], default: null },
    field: { type: Object, default: () => ({}) },
    scope: { type: Object, default: () => ({}) },
    em: { type: Object, default: () => ({}) },
    struct: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      expanded: false,
      collapseLimit: 12
    }
  },
  computed: {
    parsed() {
      const v = this.value
      if (v === null || typeof v === 'undefined' || v === '') return null
      if (typeof v === 'string') {
        try { return JSON.parse(v) } catch (e) { return v }
      }
      return v
    },
    formatted() {
      try {
        return JSON.stringify(this.parsed, null, 2)
      } catch (e) {
        return String(this.parsed)
      }
    },
    lines() {
      return this.formatted.split('\n')
    },
    visibleLines() {
      if (this.expanded || this.lines.length <= this.collapseLimit) {
        return this.lines
      }
      return this.lines.slice(0, this.collapseLimit)
    },
    typeLabel() {
      if (Array.isArray(this.parsed)) return 'Array'
      if (typeof this.parsed === 'object') return 'Object'
      return typeof this.parsed
    },
    sizeLabel() {
      if (Array.isArray(this.parsed)) return `${this.parsed.length} items`
      if (typeof this.parsed === 'object') return `${Object.keys(this.parsed).length} keys`
      return ''
    }
  },
  methods: {
    syntaxClass(line) {
      if (/^[ \t]*"/.test(line)) return 'k'
      if (/: /.test(line) && /[\[{]/.test(line)) return 'kv'
      if (/\b(true|false|null)\b/.test(line)) return 'b'
      if (/\d/.test(line) && /:/.test(line)) return 'n'
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-json {
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.detail-json__empty { color: #b3bcc7; }

.detail-json__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.detail-json__type {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #6c8fd4;
  border-radius: 3px;
}

.detail-json__size {
  font-size: 12px;
  color: #8a97a8;
}

.detail-json__toggle {
  margin-left: auto;
  padding: 0 !important;
  font-size: 12px;
}

.detail-json__code {
  margin: 0;
  padding: 14px 16px;
  background: #f4f6fb;
  border: 1px solid #dde3ef;
  border-radius: 6px;
  overflow-x: auto;
  max-height: 520px;

  code {
    font-family: inherit;
    font-size: inherit;
  }
}

.detail-json__code .k { color: #118e6e; }
.detail-json__code .kv { color: #9a5d11; }
.detail-json__code .b { color: #b5128c; font-weight: 600; }
.detail-json__code .n { color: #1b75c4; }
</style>
