<template>
  <div class="navbar">
    <hamburger :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <div class="back">
      <a class="back-link" @click="$router.go(-1)"><el-icon><el-icon-back /></el-icon> {{ $t('Back') }}</a>
      <el-divider direction="vertical" />
    </div>

    <breadcrumb class="breadcrumb-container" />

    <div class="right-menu">

      <el-dropdown class="theme-dropdown" trigger="click" @command="switchTheme">
        <div class="navbar-action theme-toggle" :title="$t('Theme')">
          <el-icon class="theme-icon"><brush /></el-icon>
          <span class="theme-swatch" :class="`theme-swatch--${currentTheme}`" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="theme in themeOptions"
              :key="theme.value"
              :command="theme.value"
              :class="{ 'is-active': currentTheme === theme.value }"
            >
              <span class="theme-option"><span class="theme-swatch" :class="`theme-swatch--${theme.value}`" />{{ $t(theme.label) }}</span>
              <el-icon v-if="currentTheme === theme.value" class="locale-check"><el-icon-caret-bottom style="transform: rotate(-90deg);" /></el-icon>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <server-health />

      <el-dropdown class="locale-dropdown" trigger="click" @command="switchLocale">
        <div class="navbar-action locale-toggle" :title="$t('Language')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="locale-icon"><path d="m12.87 15.07-2.54-2.51.03-.03A17.5 17.5 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2zm-2.62 7 1.62-4.33L19.12 17z" /></svg>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="lang in locales"
              :key="lang.value"
              :command="lang.value"
              :class="{ 'is-active': currentLocale === lang.value }"
            >
              <span class="locale-option">{{ lang.label }}</span>
              <el-icon v-if="currentLocale === lang.value" class="locale-check"><el-icon-caret-bottom style="transform: rotate(-90deg);" /></el-icon>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper navbar-action" :title="name">
          <el-avatar :size="32" :src="avatar" class="user-avatar">
            <el-icon><user-filled /></el-icon>
          </el-avatar>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <router-link :to="{ name: 'Dashboard'}">
              <el-dropdown-item>
                {{ $t('Hello, {0}', name) }}
              </el-dropdown-item>
            </router-link>
            <el-dropdown-item @click="clearCache">
              <span style="display:block;">{{ $t('Clear Cache') }}</span>
            </el-dropdown-item>
            <el-dropdown-item divided @click="logout">
              <span style="display:block;">{{ $t('Logout') }}</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { setLocale } from '@/i18n'
import { applyTheme, getTheme } from '@/utils/theme'
import { Brush, UserFilled } from '@element-plus/icons-vue'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'
import ServerHealth from './ServerHealth.vue'

export default {
  components: { Breadcrumb, Hamburger, ServerHealth, Brush, UserFilled },
  data() {
    return {
      currentLocale: localStorage.getItem('app_locale') || (navigator.language.startsWith('zh') ? 'zh' : 'en'),
      currentTheme: getTheme(),
      locales: [
        { value: 'en', label: 'English' },
        { value: 'zh', label: '中文 (简体)' },
        { value: 'zh-Hant', label: '中文 (繁體)' },
        { value: 'ja', label: '日本語' }
      ],
      themeOptions: [
        { value: 'ocean', label: 'Ocean Blue' },
        { value: 'mist', label: 'Light Gray' },
        { value: 'dark', label: 'Dark Mode' }
      ]
    }
  },
  computed: {
    ...mapGetters(['sidebar', 'avatar', 'name'])
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async switchLocale(locale) {
      if (locale === this.currentLocale) return
      await this.$store.dispatch('entity/reset')
      setLocale(locale)
      this.currentLocale = locale
      window.location.reload()
    },
    switchTheme(theme) {
      this.currentTheme = applyTheme(theme)
    },
    async clearCache() {
      await this.$store.dispatch('entity/reset')
      this.$message({ message: this.$t('Cache cleared successfully'), type: 'success' })
    },
    async logout() {
      await this.$store.dispatch('user/logout')
      this.$router.push(`/login?redirect=${this.$route.fullPath}`)
    }
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 22px 0 10px;
  background: var(--nav-bg);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 2px rgba(16, 24, 40, .02);
  backdrop-filter: blur(12px);

  .back {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;

    a {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--text-secondary);
      transition: color .2s ease;

      &:hover { color: var(--accent); }
    }
  }

  .hamburger-container {
    display: grid;
    width: 40px;
    height: 40px;
    margin-right: 6px;
    place-items: center;
    cursor: pointer;
    border-radius: 8px;
    transition: background .2s ease;
    -webkit-tap-highlight-color: transparent;

    &:hover { background: var(--control-hover); }
  }

  .breadcrumb-container { margin-left: 8px; }

  .right-menu {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;

    &:focus { outline: none; }

    .avatar-container {
      .avatar-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 2px;

        .user-avatar {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, var(--nav-bg));
          border: 1px solid color-mix(in srgb, var(--accent) 18%, transparent);
          object-fit: cover;
        }
      }
    }
  }
}

.navbar-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .2s ease;

  &:hover { background: var(--control-hover); }
}
.locale-toggle {
  padding: 0;
}
.theme-toggle {
  position: relative;
  padding: 0;
}
.theme-icon { font-size: 17px; color: var(--text-secondary); }
.theme-option { display: inline-flex; align-items: center; gap: 8px; }
.theme-swatch { position: absolute; right: 6px; bottom: 6px; display: inline-block; width: 9px; height: 9px; border: 2px solid var(--nav-bg); border-radius: 50%; }
.theme-swatch--ocean { background: linear-gradient(135deg, #2563eb 48%, #f4f7fb 48%); }
.theme-swatch--mist { background: linear-gradient(135deg, #667085 48%, #f6f7f9 48%); }
.theme-swatch--dark { background: linear-gradient(135deg, #1f2937 48%, #475467 48%); }
.locale-icon { width: 18px; height: 18px; fill: var(--text-secondary); }
.locale-option { display: inline-flex; align-items: center; gap: 8px; }
.locale-check { margin-left: auto; font-size: 12px; color: var(--accent); }

@media (max-width: 767px) {
  .navbar { padding-right: 12px; }
  .back, .breadcrumb-container { display: none !important; }
}
</style>
