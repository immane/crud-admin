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
        <div class="theme-toggle" :title="$t('Theme')">
          <span class="theme-swatch" :class="`theme-swatch--${currentTheme}`" />
          <el-icon><el-icon-caret-bottom class="locale-caret" /></el-icon>
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

      <el-dropdown class="locale-dropdown" trigger="click" @command="switchLocale">
        <div class="locale-toggle">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="locale-icon"><path d="m12.87 15.07-2.54-2.51.03-.03A17.5 17.5 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2zm-2.62 7 1.62-4.33L19.12 17z" /></svg>
          <el-icon><el-icon-caret-bottom class="locale-caret" /></el-icon>
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
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar">
          <el-icon><el-icon-caret-bottom /></el-icon>
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
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'

export default {
  components: { Breadcrumb, Hamburger },
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
    gap: 14px;
    margin-left: auto;

    &:focus { outline: none; }

    .avatar-container {
      .avatar-wrapper {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        color: var(--text-secondary);

        .user-avatar {
          width: 34px;
          height: 34px;
          border: 2px solid color-mix(in srgb, var(--accent) 15%, transparent);
          border-radius: 10px;
          object-fit: cover;
        }

        :deep(.el-icon) { font-size: 12px; }
      }
    }
  }
}

.locale-toggle {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 7px 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background .2s ease;

  &:hover { background: var(--control-hover); }
}
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background .2s ease;

  &:hover { background: var(--control-hover); }
}
.theme-option { display: inline-flex; align-items: center; gap: 8px; }
.theme-swatch { display: inline-block; width: 14px; height: 14px; border: 1px solid rgba(16, 24, 40, .16); border-radius: 50%; }
.theme-swatch--ocean { background: linear-gradient(135deg, #2563eb 48%, #f4f7fb 48%); }
.theme-swatch--mist { background: linear-gradient(135deg, #667085 48%, #f6f7f9 48%); }
.theme-swatch--dark { background: linear-gradient(135deg, #1f2937 48%, #475467 48%); }
.locale-icon { width: 17px; height: 17px; fill: var(--text-secondary); }
.locale-caret { font-size: 10px; color: var(--text-secondary); }
.locale-option { display: inline-flex; align-items: center; gap: 8px; }
.locale-check { margin-left: auto; font-size: 12px; color: var(--accent); }

@media (max-width: 767px) {
  .navbar { padding-right: 12px; }
  .back, .breadcrumb-container { display: none !important; }
}
</style>
