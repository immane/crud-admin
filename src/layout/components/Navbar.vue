<template>
  <div class="navbar">
    <hamburger :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <div class="back">
      <a class="back-link" @click="$router.go(-1)"><el-icon><el-icon-back /></el-icon> 返回</a>
      <el-divider direction="vertical" />
    </div>

    <breadcrumb class="breadcrumb-container" />

    <div class="right-menu">

      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar">
          <el-icon><el-icon-caret-bottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
          <router-link :to="{ name: 'Dashboard'}">
            <el-dropdown-item>
              您好，{{ name }}
            </el-dropdown-item>
          </router-link>
          <el-dropdown-item @click="clearCache">
            <span style="display:block;">清空缓存</span>
          </el-dropdown-item>
          <el-dropdown-item divided @click="logout">
            <span style="display:block;">登出</span>
          </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import Hamburger from '@/components/Hamburger'

export default {
  components: {
    Breadcrumb,
    Hamburger
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'name'
    ])
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async clearCache() {
      await this.$store.dispatch('entity/reset')
      this.$message({
        message: '已成功清空缓存',
        type: 'success'
      })
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
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);

  .back {
    display: inline-block;
    float: left;
    font-size: 14px;
    line-height: 50px;
    a {
      transition: background .3s;
      &:hover {
        color: dodgerblue;
      }
    }
  }

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color:transparent;

    &:hover {
      background: rgba(0, 0, 0, .025)
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background .3s;

        &:hover {
          background: rgba(0, 0, 0, .025)
        }
      }
    }

    .avatar-container {
      margin-right: 30px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }
  }
}
</style>
