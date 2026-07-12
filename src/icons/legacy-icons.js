import {
  ArrowLeft, ArrowRight, ArrowDown, Back,
  CaretBottom, CaretRight,
  Plus, Minus, Delete, Edit, EditPen,
  View, Search, Download, Upload,
  Refresh, RefreshLeft, Loading,
  Clock, Timer, Location, InfoFilled,
  HomeFilled, Goods, Document, Promotion,
  Money, Coin, User, Setting,
  Sunny, PartlyCloudy, Cloudy, Drizzling, Pouring, Lightning,
  Sort,
  Tickets, Notebook, Wallet
} from '@element-plus/icons-vue'

const iconMap = {
  'el-icon-arrow-left': ArrowLeft,
  'el-icon-arrow-right': ArrowRight,
  'el-icon-arrow-down': ArrowDown,
  'el-icon-back': Back,
  'el-icon-caret-bottom': CaretBottom,
  'el-icon-caret-right': CaretRight,
  'el-icon-plus': Plus,
  'el-icon-minus': Minus,
  'el-icon-delete': Delete,
  'el-icon-edit': Edit,
  'el-icon-edit-outline': EditPen,
  'el-icon-view': View,
  'el-icon-search': Search,
  'el-icon-download': Download,
  'el-icon-upload': Upload,
  'el-icon-refresh': Refresh,
  'el-icon-refresh-left': RefreshLeft,
  'el-icon-loading': Loading,
  'el-icon-time': Clock,
  'el-icon-timer': Timer,
  'el-icon-location-outline': Location,
  'el-icon-info': InfoFilled,
  'el-icon-s-home': HomeFilled,
  'el-icon-goods': Goods,
  'el-icon-s-order': Document,
  'el-icon-s-promotion': Promotion,
  'el-icon-document': Document,
  'el-icon-money': Money,
  'el-icon-coin': Coin,
  'el-icon-user': User,
  'el-icon-setting': Setting,
  'el-icon-sunny': Sunny,
  'el-icon-partly-cloudy': PartlyCloudy,
  'el-icon-cloudy': Cloudy,
  'el-icon-light-rain': Drizzling,
  'el-icon-heavy-rain': Pouring,
  'el-icon-lightning': Lightning,
  'el-icon-sort': Sort,
  'el-icon-tickets': Tickets,
  'el-icon-notebook': Notebook,
  'el-icon-wallet': Wallet
}

export default function installLegacyIcons(app) {
  Object.entries(iconMap).forEach(([legacyName, component]) => {
    if (component) {
      app.component(legacyName, component)
    }
  })
}
