<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item,index) in levelList" :key="item.path">
        <span v-if="item.redirect==='noRedirect'||index==levelList.length-1" class="no-redirect">{{ item.meta.title }}</span>
        <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script>
import pathToRegexp from 'path-to-regexp'

export default {
  data() {
    return {
      levelList: null
    }
  },
  watch: {
    $route() {
      this.getBreadcrumb()
    }
  },
  created() {
    this.getBreadcrumb()
  },
  methods: {
    getBreadcrumb() {
      // only show routes with meta.title
      const matched = this.$route.matched.filter(item => item.meta && item.meta.title)

      if (matched.length > 0) {
        this.levelList = matched.filter(item => item.meta && item.meta.title && item.meta.breadcrumb !== false)
        return
      }

      // EasyAdmin fallback routes (/:entityParam/...) carry no meta.title on the
      // matched records, so rebuild the breadcrumb from the menu config instead.
      const { entityParam } = this.$route.params
      this.levelList = entityParam ? this.buildEntityBreadcrumb(entityParam) : []
    },
    buildEntityBreadcrumb(entityParam) {
      const found = this.findEntityMenu(entityParam)
      const crumbs = []

      if (found) {
        const { group, child } = found
        if (group.meta && group.meta.title) {
          crumbs.push({ path: group.path, redirect: 'noRedirect', meta: { title: group.meta.title }})
        }
        crumbs.push({
          path: `/${entityParam}/list`,
          meta: { title: child.meta && child.meta.title }
        })
      } else {
        crumbs.push({ meta: { title: entityParam }})
      }

      const action = this.entityAction()
      if (action) {
        crumbs.push({ path: this.$route.fullPath, meta: { title: action }})
      }

      return crumbs
    },
    findEntityMenu(entityParam) {
      const menuRoutes = (this.$store && this.$store.state.permission && this.$store.state.permission.routes) || []
      for (const group of menuRoutes) {
        if (!group.children) continue
        const child = group.children.find(route => {
          const segments = (route.path || '').split('/').filter(Boolean)
          return segments.length >= 3 && segments[0] === 'dummy' && segments[1] === entityParam && route.meta && route.meta.title
        })
        if (child) return { group, child }
      }
      return null
    },
    entityAction() {
      const { path } = this.$route
      if (path.endsWith('/create')) return this.$t('New')
      if (path.includes('/update')) return this.$t('Edit')
      if (path.includes('/detail')) return this.$t('Details')
      return null
    },
    pathCompile(path) {
      // To solve this problem https://github.com/PanJiaChen/vue-element-admin/issues/561
      const { params } = this.$route
      var toPath = pathToRegexp.compile(path)
      return toPath(params)
    },
    handleLink(item) {
      const { redirect, path } = item
      if (redirect) {
        this.$router.push(redirect)
        return
      }
      this.$router.push(this.pathCompile(path))
    }
  }
}
</script>

<style lang="scss" scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;

  .no-redirect {
    color: #97a8be;
    cursor: text;
  }
}
</style>
