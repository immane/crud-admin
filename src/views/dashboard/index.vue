<template>
  <main class="dashboard">
    <section class="dashboard__hero">
      <div>
        <p class="dashboard__eyebrow">OPERATIONS OVERVIEW</p>
        <h1>{{ greeting }}，{{ name || '管理员' }}</h1>
        <p class="dashboard__intro">实时掌握业务规模、订单处理与系统运行状况。</p>
      </div>
      <div class="dashboard__hero-actions">
        <span class="dashboard__updated"><i class="el-icon-time" /> 更新于 {{ updatedAt }}</span>
        <el-button type="primary" icon="el-icon-refresh" :loading="loading" @click="loadDashboard">刷新数据</el-button>
      </div>
    </section>

    <section v-loading="loading" class="dashboard__metrics">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card" :class="`metric-card--${metric.tone}`">
        <div class="metric-card__icon"><i :class="metric.icon" /></div>
        <div>
          <p>{{ metric.label }}</p>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.hint }}</small>
        </div>
      </article>
    </section>

    <section class="dashboard__grid">
      <article v-loading="loading" class="panel panel--revenue">
        <header class="panel__header">
          <div>
            <p class="panel__kicker">ORDER PULSE</p>
            <h2>近期订单金额走势</h2>
          </div>
          <span class="panel__badge">最近 {{ orderSeries.length }} 笔</span>
        </header>
        <div v-if="orderSeries.length" class="chart">
          <div class="chart__summary">
            <strong>{{ formatAmount(orderTotal) }}</strong>
            <span>当前样本订单总额</span>
          </div>
          <svg class="chart__svg" viewBox="0 0 560 190" preserveAspectRatio="none" role="img" aria-label="近期订单金额走势">
            <defs>
              <linearGradient id="orderArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#39a47a" stop-opacity=".34" />
                <stop offset="100%" stop-color="#39a47a" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line v-for="point in [35, 85, 135]" :key="point" x1="0" x2="560" :y1="point" :y2="point" class="chart__grid-line" />
            <path :d="areaPath" fill="url(#orderArea)" />
            <path :d="linePath" class="chart__line" />
            <circle v-for="(point, index) in chartPoints" :key="index" :cx="point.x" :cy="point.y" r="4" class="chart__point" />
          </svg>
          <div class="chart__axis"><span>较早</span><span>当前</span></div>
        </div>
        <div v-else class="panel__empty">暂无可用于分析的订单金额数据</div>
      </article>

      <article class="panel panel--weather" :class="weatherClass">
        <header class="panel__header">
          <div>
            <p class="panel__kicker">LOCAL WEATHER</p>
            <h2>{{ weather.location }}</h2>
          </div>
          <button class="weather__locate" type="button" title="获取本地天气" @click="loadWeather(true)"><i class="el-icon-location-outline" /></button>
        </header>
        <div class="weather__body">
          <div class="weather__symbol"><i :class="weather.icon" /></div>
          <strong>{{ weather.temperature }}<sup>°</sup></strong>
          <div><b>{{ weather.condition }}</b><span>体感 {{ weather.apparentTemperature }}°</span></div>
        </div>
        <footer class="weather__footer"><span>风速 {{ weather.windSpeed }} km/h</span><span>{{ weather.note }}</span></footer>
      </article>
    </section>

    <section class="dashboard__lower-grid">
      <article v-loading="loading" class="panel panel--orders">
        <header class="panel__header">
          <div><p class="panel__kicker">LATEST ORDERS</p><h2>最近订单</h2></div>
          <router-link :to="{ name: 'OrderList' }">查看全部 <i class="el-icon-arrow-right" /></router-link>
        </header>
        <div v-if="recentOrders.length" class="order-list">
          <div v-for="order in recentOrders" :key="order.id" class="order-row">
            <div class="order-row__identity"><span class="order-row__avatar">{{ orderInitial(order) }}</span><div><b>#{{ order.id }}</b><small>{{ order.user?.__toString || order.user?.username || order.uuid || '访客订单' }}</small></div></div>
            <span>{{ formatAmount(order.totalAmount) }}</span>
            <el-tag size="mini" effect="plain" :type="statusType(order.status)">{{ statusLabel(order.status) }}</el-tag>
          </div>
        </div>
        <div v-else class="panel__empty">暂无订单数据</div>
      </article>

      <article v-loading="loading" class="panel panel--activity">
        <header class="panel__header"><div><p class="panel__kicker">SYSTEM ACTIVITY</p><h2>资金与业务动态</h2></div></header>
        <div v-if="recentTransactions.length" class="activity-list">
          <div v-for="transaction in recentTransactions" :key="transaction.id" class="activity-row">
            <span class="activity-row__icon"><i :class="transactionIcon(transaction.type)" /></span>
            <div><b>{{ transactionLabel(transaction.type) }}</b><small>{{ transaction.referenceId || transaction.uuid || `交易 #${transaction.id}` }}</small></div>
            <span class="activity-row__amount" :class="{ 'activity-row__amount--negative': transaction.type === 'withdrawal' || transaction.type === 'fee' }">{{ transaction.amount == null ? '-' : formatAmount(transaction.amount) }}</span>
          </div>
        </div>
        <div v-else class="panel__empty">暂无资金流水数据</div>
      </article>
    </section>
  </main>
</template>

<script>
import { mapGetters } from 'vuex'
import EntityManage from '@/utils/entity'

const entityManagers = {
  orders: new EntityManage('Order'),
  products: new EntityManage('Product'),
  users: new EntityManage('User'),
  transactions: new EntityManage({ name: 'WalletTransaction', plural: 'transactions' })
}

const weatherByCode = {
  0: ['晴朗', 'el-icon-sunny', 'weather--sunny'],
  1: ['少云', 'el-icon-partly-cloudy', 'weather--cloudy'],
  2: ['多云', 'el-icon-cloudy', 'weather--cloudy'],
  3: ['阴天', 'el-icon-cloudy', 'weather--cloudy'],
  45: ['雾', 'el-icon-cloudy', 'weather--cloudy'],
  48: ['雾', 'el-icon-cloudy', 'weather--cloudy'],
  51: ['毛毛雨', 'el-icon-light-rain', 'weather--rainy'],
  61: ['小雨', 'el-icon-light-rain', 'weather--rainy'],
  63: ['降雨', 'el-icon-light-rain', 'weather--rainy'],
  65: ['大雨', 'el-icon-heavy-rain', 'weather--rainy'],
  71: ['小雪', 'el-icon-light-rain', 'weather--cloudy'],
  80: ['阵雨', 'el-icon-light-rain', 'weather--rainy'],
  95: ['雷暴', 'el-icon-lightning', 'weather--rainy']
}

export default {
  name: 'Dashboard',
  data() {
    return {
      loading: true,
      updatedAt: '--:--',
      totals: { orders: 0, products: 0, users: 0, pending: 0 },
      recentOrders: [],
      recentTransactions: [],
      weather: { location: '本地天气', temperature: '--', apparentTemperature: '--', windSpeed: '--', condition: '获取中', icon: 'el-icon-cloudy', note: '定位后获取实时天气', tone: 'weather--cloudy' }
    }
  },
  computed: {
    ...mapGetters(['name']),
    greeting() {
      const hour = new Date().getHours()
      if (hour < 12) return '上午好'
      if (hour < 18) return '下午好'
      return '晚上好'
    },
    metrics() {
      return [
        { label: '订单总量', value: this.totals.orders, hint: '全部订单记录', icon: 'el-icon-s-order', tone: 'blue' },
        { label: '待处理订单', value: this.totals.pending, hint: '最近订单中的待办', icon: 'el-icon-timer', tone: 'amber' },
        { label: '商品数量', value: this.totals.products, hint: '当前商品目录', icon: 'el-icon-goods', tone: 'green' },
        { label: '用户规模', value: this.totals.users, hint: '已注册用户', icon: 'el-icon-user', tone: 'violet' }
      ]
    },
    orderSeries() {
      return this.recentOrders.slice().reverse().map(order => Number(order.totalAmount) || 0)
    },
    orderTotal() {
      return this.orderSeries.reduce((sum, value) => sum + value, 0)
    },
    chartPoints() {
      if (!this.orderSeries.length) return []
      const max = Math.max(...this.orderSeries, 1)
      const width = 520
      const step = this.orderSeries.length > 1 ? width / (this.orderSeries.length - 1) : width
      return this.orderSeries.map((value, index) => ({ x: 20 + index * step, y: 160 - value / max * 125 }))
    },
    linePath() {
      return this.chartPoints.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
    },
    areaPath() {
      if (!this.chartPoints.length) return ''
      const first = this.chartPoints[0]
      const last = this.chartPoints[this.chartPoints.length - 1]
      return `M ${first.x} 170 ${this.linePath} L ${last.x} 170 Z`
    },
    weatherClass() { return this.weather.tone }
  },
  created() {
    this.loadDashboard()
  },
  mounted() {
    this.loadWeather()
  },
  methods: {
    async loadDashboard() {
      this.loading = true
      const query = { page: 1, limit: 12, '@order': 'entity.id|DESC' }
      const [orders, products, users, transactions] = await Promise.all([
        entityManagers.orders.list(query).catch(() => ({ data: [], paginator: {}})),
        entityManagers.products.list({ page: 1, limit: 1 }).catch(() => ({ data: [], paginator: {}})),
        entityManagers.users.list({ page: 1, limit: 1 }).catch(() => ({ data: [], paginator: {}})),
        entityManagers.transactions.list({ page: 1, limit: 6, '@order': 'entity.id|DESC' }).catch(() => ({ data: [], paginator: {}}))
      ])
      this.recentOrders = orders.data || []
      this.recentTransactions = transactions.data || []
      this.totals = {
        orders: this.totalOf(orders),
        products: this.totalOf(products),
        users: this.totalOf(users),
        pending: this.recentOrders.filter(order => ['draft', 'pending', 'confirmed'].includes(order.status)).length
      }
      this.updatedAt = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      this.loading = false
    },
    totalOf(response) {
      return Number(response.paginator?.totalCount ?? response.paginator?.total ?? response.data?.length ?? 0)
    },
    async loadWeather(forceLocation = false) {
      const fallback = () => this.fetchWeather(39.9042, 116.4074, '北京')
      if (!navigator.geolocation) return fallback()
      navigator.geolocation.getCurrentPosition(
        position => this.fetchWeather(position.coords.latitude, position.coords.longitude, '本地天气'),
        () => fallback(),
        { enableHighAccuracy: false, timeout: forceLocation ? 10000 : 4000, maximumAge: 1800000 }
      )
    },
    async fetchWeather(latitude, longitude, location) {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh`)
        const data = await response.json()
        const current = data.current
        const [condition, icon, tone] = weatherByCode[current.weather_code] || ['天气正常', 'el-icon-cloudy', 'weather--cloudy']
        this.weather = { location, temperature: Math.round(current.temperature_2m), apparentTemperature: Math.round(current.apparent_temperature), windSpeed: Math.round(current.wind_speed_10m), condition, icon, note: '实时数据', tone }
      } catch (e) {
        this.weather.note = '天气服务暂不可用'
        this.weather.condition = '暂不可用'
      }
    },
    formatAmount(value) {
      const number = Number(value)
      if (!Number.isFinite(number)) return '-'
      return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2 }).format(number / 100)
    },
    orderInitial(order) {
      const source = order.user?.__toString || order.user?.username || order.uuid || String(order.id)
      return String(source).slice(0, 1).toUpperCase()
    },
    statusLabel(status) {
      return { draft: '草稿', pending: '待处理', confirmed: '已确认', paid: '已支付', fulfilled: '已发货', completed: '已完成', cancelled: '已取消', refunded: '已退款' }[status] || status || '未知'
    },
    statusType(status) {
      return ({ paid: 'success', completed: 'success', fulfilled: 'success', pending: 'warning', confirmed: 'warning', cancelled: 'info', refunded: 'danger' })[status] || 'info'
    },
    transactionLabel(type) {
      return ({ deposit: '账户充值', withdrawal: '账户提现', transfer: '余额转账', fee: '服务费扣除', refund: '退款入账' })[type] || type || '资金变动'
    },
    transactionIcon(type) {
      return ({ deposit: 'el-icon-plus', withdrawal: 'el-icon-minus', transfer: 'el-icon-sort', fee: 'el-icon-coin', refund: 'el-icon-refresh-left' })[type] || 'el-icon-money'
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard { min-height: 100%; padding: 28px; color: #213047; background: #f5f7fb; }
.dashboard__hero, .panel, .metric-card { border: 1px solid #e6ebf2; box-shadow: 0 10px 24px rgba(38, 58, 88, .05); }
.dashboard__hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 30px 34px; color: #fff; background: linear-gradient(115deg, #152c54, #285498 65%, #3b72b6); border-radius: 16px; overflow: hidden; position: relative; }
.dashboard__hero::after { position: absolute; width: 330px; height: 330px; right: -100px; bottom: -220px; content: ''; border: 50px solid rgba(255,255,255,.07); border-radius: 50%; }
.dashboard__eyebrow, .panel__kicker { margin: 0 0 7px; color: #7f96bb; font-size: 11px; font-weight: 700; letter-spacing: 1.4px; }
.dashboard__hero .dashboard__eyebrow { color: #a9c3e8; }
h1, h2, p { margin-top: 0; } h1 { margin-bottom: 8px; font-size: 26px; font-weight: 600; } h2 { margin: 0; font-size: 16px; font-weight: 600; }
.dashboard__intro { margin: 0; color: #c7d5e9; font-size: 14px; }.dashboard__hero-actions { z-index: 1; display: flex; align-items: center; gap: 18px; }.dashboard__updated { color: #c7d5e9; font-size: 12px; }
.dashboard__metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin: 20px 0; }.metric-card { display: flex; align-items: center; gap: 15px; padding: 20px; background: #fff; border-radius: 12px; }.metric-card p { margin: 0 0 5px; color: #8190a5; font-size: 13px; }.metric-card strong { display: block; color: #24334b; font-size: 25px; line-height: 1.1; }.metric-card small { display: block; margin-top: 5px; color: #a6b1c0; font-size: 11px; }.metric-card__icon { display: grid; width: 43px; height: 43px; place-items: center; font-size: 20px; border-radius: 12px; }.metric-card--blue .metric-card__icon { color: #3d72c4; background: #eaf1ff; }.metric-card--amber .metric-card__icon { color: #b87b18; background: #fff3dc; }.metric-card--green .metric-card__icon { color: #228869; background: #e6f6ef; }.metric-card--violet .metric-card__icon { color: #7657b6; background: #f0ebff; }
.dashboard__grid, .dashboard__lower-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(300px, .8fr); gap: 20px; }.dashboard__lower-grid { margin-top: 20px; grid-template-columns: repeat(2, minmax(0, 1fr)); }.panel { min-height: 300px; padding: 23px 25px; background: #fff; border-radius: 14px; }.panel__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }.panel__header > a { color: #497bc6; font-size: 13px; }.panel__empty { display: grid; min-height: 190px; color: #a2adbd; font-size: 13px; place-items: center; }.panel__badge { padding: 4px 9px; color: #34785f; background: #e7f6ef; border-radius: 20px; font-size: 11px; }
.chart__summary { display: flex; align-items: baseline; gap: 10px; margin-top: 20px; }.chart__summary strong { color: #244c42; font-size: 25px; }.chart__summary span { color: #92a39e; font-size: 12px; }.chart__svg { width: 100%; height: 175px; margin-top: 5px; overflow: visible; }.chart__grid-line { stroke: #edf1f4; stroke-dasharray: 3 5; }.chart__line { fill: none; stroke: #36a077; stroke-linecap: round; stroke-linejoin: round; stroke-width: 3; }.chart__point { fill: #fff; stroke: #36a077; stroke-width: 3; }.chart__axis { display: flex; justify-content: space-between; color: #a4aebd; font-size: 11px; }
.panel--weather { color: #fff; border: 0; background: linear-gradient(145deg, #438bd4, #315a9e); }.panel--weather .panel__kicker { color: #cde3fc; }.weather--sunny { background: linear-gradient(145deg, #4e9bdc, #28558f); }.weather--cloudy { background: linear-gradient(145deg, #6a87aa, #425977); }.weather--rainy { background: linear-gradient(145deg, #526f9e, #2e426b); }.weather__locate { padding: 5px; color: #fff; background: transparent; border: 0; cursor: pointer; font-size: 20px; }.weather__body { display: flex; align-items: center; gap: 16px; margin: 38px 0 33px; }.weather__symbol { font-size: 47px; }.weather__body > strong { font-size: 55px; font-weight: 400; letter-spacing: -3px; }.weather__body sup { font-size: 22px; }.weather__body b, .weather__body span { display: block; }.weather__body b { margin-bottom: 5px; font-size: 16px; }.weather__body span, .weather__footer { color: #d5e5f7; font-size: 12px; }.weather__footer { display: flex; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.2); }
.order-list, .activity-list { margin-top: 16px; }.order-row, .activity-row { display: grid; align-items: center; grid-template-columns: minmax(0, 1fr) 105px 76px; min-height: 58px; border-bottom: 1px solid #edf0f5; }.order-row:last-child, .activity-row:last-child { border-bottom: 0; }.order-row__identity { display: flex; align-items: center; gap: 10px; min-width: 0; }.order-row__avatar { display: grid; flex: 0 0 auto; width: 30px; height: 30px; color: #3769ad; background: #eaf1fb; border-radius: 50%; font-size: 12px; place-items: center; }.order-row b, .activity-row b { display: block; color: #34425a; font-size: 13px; }.order-row small, .activity-row small { display: block; max-width: 180px; margin-top: 3px; color: #9ca8b8; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.order-row > span { color: #46546a; font-size: 13px; }.activity-row { grid-template-columns: 40px minmax(0, 1fr) 100px; }.activity-row__icon { display: grid; width: 28px; height: 28px; color: #3e8069; background: #e9f6f0; border-radius: 8px; font-size: 14px; place-items: center; }.activity-row__amount { color: #2d8063; font-size: 13px; font-weight: 600; text-align: right; }.activity-row__amount--negative { color: #bf6670; }
@media screen and (max-width: 1100px) { .dashboard__metrics { grid-template-columns: repeat(2, 1fr); }.dashboard__grid, .dashboard__lower-grid { grid-template-columns: 1fr; } }
@media screen and (max-width: 640px) { .dashboard { padding: 14px; }.dashboard__hero { align-items: flex-start; flex-direction: column; padding: 24px; }.dashboard__hero-actions { width: 100%; justify-content: space-between; }.dashboard__metrics { grid-template-columns: 1fr; gap: 12px; }.panel { padding: 19px; }.dashboard__updated { display: none; }.order-row { grid-template-columns: minmax(0, 1fr) 78px 68px; }.activity-row { grid-template-columns: 38px minmax(0, 1fr) 80px; } }
</style>
