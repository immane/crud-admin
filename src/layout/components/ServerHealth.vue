<template>
  <span class="server-health">
    <el-button
      class="server-health__trigger"
      :title="statusTitle"
      text
      circle
      aria-label="Server Health"
      @click="visible = true"
    >
      <span class="server-health__icon">
        <el-icon><monitor /></el-icon>
        <span class="server-health__indicator" :class="`server-health__indicator--${healthState}`" />
      </span>
    </el-button>

    <el-dialog
      v-model="visible"
      class="server-health-dialog"
      append-to-body
      align-center
      width="min(94vw, 1120px)"
      :close-on-click-modal="false"
      :lock-scroll="false"
      @open="refresh"
    >
      <template #header>
        <div class="server-health-dialog__header">
          <div>
            <div class="server-health-dialog__title">{{ $t('Server Health') }}</div>
            <div v-if="checkedAt" class="server-health-dialog__updated">{{ $t('Last checked') }} {{ checkedAt }}</div>
          </div>
          <el-button :title="$t('Refresh')" circle @click="refresh">
            <el-icon :class="{ 'server-health__refresh--spinning': loading }"><refresh /></el-icon>
          </el-button>
        </div>
      </template>

      <div class="server-health-dialog__body">
        <admin-skeleton v-if="loading && !checkedAt" :rows="5" />
        <template v-else>
          <section class="server-health-dialog__probes">
          <article class="health-probe">
            <div class="health-probe__label">{{ $t('Liveness') }}</div>
            <el-tag :type="tagType(liveness.status)" effect="light">{{ displayStatus(liveness.status) }}</el-tag>
            <p>{{ $t('Process serving status') }}</p>
            <p v-if="liveness.error" class="health-probe__error">{{ liveness.error }}</p>
          </article>
          <article class="health-probe">
            <div class="health-probe__label">{{ $t('Readiness') }}</div>
            <el-tag :type="tagType(readiness.status)" effect="light">{{ displayStatus(readiness.status) }}</el-tag>
            <p>{{ $t('Database required, Redis optional') }}</p>
            <p v-if="readiness.error" class="health-probe__error">{{ readiness.error }}</p>
            <div v-if="Object.keys(readiness.checks).length" class="health-probe__checks">
              <span v-for="(value, name) in readiness.checks" :key="name">
                <strong>{{ checkLabel(name) }}</strong>
                <el-tag size="small" :type="tagType(checkStatus(value))" effect="plain">{{ displayStatus(checkStatus(value)) }}</el-tag>
              </span>
            </div>
          </article>
        </section>

        <section class="server-health-dialog__metrics">
          <div class="server-health-dialog__section-header">
            <div>
              <h3>{{ $t('Metrics') }}</h3>
              <p>{{ $t('{0} metric samples', metricRows.length) }}</p>
            </div>
          </div>

          <el-alert v-if="metricsError" :title="metricsError" type="warning" :closable="false" show-icon />
          <el-empty v-else-if="!metricRows.length && !loading" :description="$t('No metrics available')" :image-size="76" />
          <el-table v-else :data="metricRows" max-height="380" size="small" stripe>
            <el-table-column prop="name" :label="$t('Metric')" min-width="260" />
            <el-table-column :label="$t('Labels')" min-width="260">
              <template #default="{ row }"><code>{{ row.labels || '-' }}</code></template>
            </el-table-column>
            <el-table-column :label="$t('Value')" width="180" align="right">
              <template #default="{ row }"><code>{{ formatMetricValue(row.value) }}</code></template>
            </el-table-column>
          </el-table>

          <el-collapse v-if="metricsText" class="server-health-dialog__raw">
            <el-collapse-item :title="$t('Raw metrics')" name="raw">
              <pre>{{ metricsText }}</pre>
            </el-collapse-item>
          </el-collapse>
        </section>
        </template>
      </div>
    </el-dialog>
  </span>
</template>

<script>
import axios from 'axios'
import AdminSkeleton from '@/components/AdminSkeleton.vue'
import { Monitor, Refresh } from '@element-plus/icons-vue'
import { getToken } from '@/utils/auth'
import { getLocale } from '@/i18n'

const healthClient = axios.create({
  baseURL: process.env.VITE_BASE_API,
  timeout: 15000
})

const emptyProbe = () => ({ status: 'unknown', checks: {}, error: '' })

export default {
  name: 'ServerHealth',
  components: { Monitor, Refresh, AdminSkeleton },
  data() {
    return {
      visible: false,
      loading: false,
      liveness: emptyProbe(),
      readiness: emptyProbe(),
      metricsText: '',
      metricsError: '',
      checkedAt: '',
      healthTimer: null
    }
  },
  computed: {
    healthState() {
      if (this.liveness.status === 'unknown') return 'unknown'
      if (this.liveness.status !== 'ok') return 'down'
      const database = this.checkStatus(this.readiness.checks.database)
      // Redis is optional: only the required database check controls the navbar status.
      return database === 'ok' || database === 'healthy' || (database === 'unknown' && this.readiness.status === 'ok')
        ? 'healthy'
        : 'degraded'
    },
    statusTitle() {
      const labels = {
        healthy: this.$t('Healthy'),
        degraded: this.$t('Degraded'),
        down: this.$t('Unavailable'),
        unknown: this.$t('Checking')
      }
      return `${this.$t('Server Health')}: ${labels[this.healthState]}`
    },
    metricRows() {
      return this.metricsText.split('\n').flatMap(line => {
        const match = line.trim().match(/^([a-zA-Z_:][\w:]*)(?:\{([^}]*)\})?\s+([^\s]+)(?:\s+\d+)?$/)
        return match ? [{ name: match[1], labels: match[2] || '', value: match[3] }] : []
      })
    }
  },
  mounted() {
    this.refreshStatus()
    this.healthTimer = window.setInterval(() => this.refreshStatus(), 30000)
  },
  beforeUnmount() {
    window.clearInterval(this.healthTimer)
  },
  methods: {
    requestHeaders() {
      const token = getToken()
      return {
        'Accept-Language': getLocale(),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    },
    async fetchProbe(path) {
      try {
        const response = await healthClient.get(path, { headers: this.requestHeaders() })
        const body = response.data || {}
        return { status: body.status || 'ok', checks: body.checks || {}, error: '' }
      } catch (error) {
        const body = error.response?.data || {}
        return {
          status: body.status || 'error',
          checks: body.checks || {},
          error: body.message || error.message || this.$t('Health check failed')
        }
      }
    },
    async fetchMetrics() {
      try {
        const response = await healthClient.get('/metrics', {
          headers: { ...this.requestHeaders(), Accept: 'text/plain; version=0.0.4' },
          responseType: 'text'
        })
        return { text: String(response.data || ''), error: '' }
      } catch (error) {
        return { text: '', error: error.response?.data?.message || error.message || this.$t('Metrics unavailable') }
      }
    },
    async refresh() {
      if (this.loading) return
      this.loading = true
      const [liveness, readiness, metrics] = await Promise.all([
        this.fetchProbe('/health/live'),
        this.fetchProbe('/health/ready'),
        this.fetchMetrics()
      ])
      this.liveness = liveness
      this.readiness = readiness
      this.metricsText = metrics.text
      this.metricsError = metrics.error
      this.checkedAt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date())
      this.loading = false
    },
    async refreshStatus() {
      if (this.loading) return
      const [liveness, readiness] = await Promise.all([
        this.fetchProbe('/health/live'),
        this.fetchProbe('/health/ready')
      ])
      this.liveness = liveness
      this.readiness = readiness
    },
    tagType(status) {
      if (status === 'ok') return 'success'
      if (status === 'degraded') return 'warning'
      if (status === 'unknown') return 'info'
      return 'danger'
    },
    displayStatus(status) {
      return status === 'ok' ? this.$t('Healthy') : status === 'degraded' ? this.$t('Degraded') : status === 'unknown' ? this.$t('Unknown') : this.$t('Unavailable')
    },
    checkStatus(value) {
      if (typeof value === 'object' && value) return value.status || (value.ok === true ? 'ok' : 'error')
      return value === true ? 'ok' : String(value || 'unknown')
    },
    checkLabel(name) {
      return name === 'database' ? this.$t('Database') : name === 'redis' ? 'Redis' : name
    },
    formatMetricValue(value) {
      const number = Number(value)
      return Number.isFinite(number) ? new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(number) : value
    }
  }
}
</script>

<style lang="scss" scoped>
.server-health { display: inline-flex; }
.server-health__trigger { color: var(--text-secondary); }
.server-health__trigger:hover { color: var(--accent); background: var(--control-hover); }
.server-health__icon { position: relative; display: inline-flex; }
// Refresh icon spins in place: transform never affects layout, so the
// circle button content cannot shift while refreshing.
.server-health__refresh--spinning svg { animation: server-health-spin 1s linear infinite; }
@keyframes server-health-spin { to { transform: rotate(360deg); } }.server-health__indicator { position: absolute; right: -4px; bottom: -3px; width: 8px; height: 8px; border: 2px solid var(--nav-bg); border-radius: 50%; background: #98a2b3; box-sizing: content-box; }
.server-health__indicator--healthy { background: var(--el-color-success); box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-success) 18%, transparent); }
.server-health__indicator--degraded { background: var(--el-color-warning); box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-warning) 18%, transparent); }
.server-health__indicator--down { background: var(--el-color-danger); box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-danger) 18%, transparent); }

:deep(.server-health-dialog) { border-radius: 12px; overflow: hidden; }
:deep(.server-health-dialog .el-dialog__header) { padding: 18px 22px 14px; margin-right: 0; border-bottom: 1px solid var(--border); }
:deep(.server-health-dialog .el-dialog__body) { padding: 20px 22px 24px; }
.server-health-dialog__header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.server-health-dialog__title { color: var(--text-primary); font-size: 17px; font-weight: 650; }
.server-health-dialog__updated { margin-top: 3px; color: var(--text-secondary); font-size: 12px; }
.server-health-dialog__probes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.health-probe { min-height: 112px; padding: 16px; background: var(--control-hover); border: 1px solid var(--border); border-radius: 10px; }
.health-probe__label { margin-bottom: 9px; color: var(--text-primary); font-size: 14px; font-weight: 650; }
.health-probe p { margin: 9px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
.health-probe .health-probe__error { color: var(--el-color-danger); }
.health-probe__checks { display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 12px; }
.health-probe__checks span { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 12px; }
.health-probe__checks strong { color: var(--text-primary); font-weight: 600; }
.server-health-dialog__metrics { margin-top: 24px; }
.server-health-dialog__section-header h3 { margin: 0; color: var(--text-primary); font-size: 15px; }
.server-health-dialog__section-header p { margin: 4px 0 12px; color: var(--text-secondary); font-size: 12px; }
.server-health-dialog__raw { margin-top: 16px; }
.server-health-dialog__raw pre { max-height: 260px; margin: 0; padding: 12px; overflow: auto; color: var(--text-primary); background: var(--control-hover); border-radius: 6px; font-size: 12px; line-height: 1.55; }
code { color: var(--text-secondary); font-size: 12px; white-space: normal; word-break: break-word; }

@media (max-width: 640px) {
  .server-health-dialog__probes { grid-template-columns: 1fr; }
  :deep(.server-health-dialog .el-dialog__body) { padding: 16px; }
}
</style>
