<template>
  <div class="admin-skeleton" :class="`admin-skeleton--cols-${cols}`" aria-hidden="true">
    <div v-for="n in rows" :key="n" class="admin-skeleton__field">
      <div class="admin-skeleton__line admin-skeleton__line--label" />
      <div class="admin-skeleton__line admin-skeleton__line--value" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminSkeleton',
  props: {
    rows: { type: Number, default: 4 },
    cols: { type: [Number, String], default: 1 }
  }
}
</script>

<style scoped>
.admin-skeleton {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr);
}
.admin-skeleton--cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.admin-skeleton--cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.admin-skeleton--cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.admin-skeleton__field {
  padding: 20px 28px;
  background: var(--surface, #fff);
  border: 1px solid var(--border, #ebeef5);
  border-radius: 12px;
}
.admin-skeleton__line {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--control-hover, #f2f3f5) 25%,
    var(--border, #e5e7eb) 50%,
    var(--control-hover, #f2f3f5) 75%
  );
  background-size: 200% 100%;
  animation: admin-skeleton-shimmer 1.4s ease-in-out infinite;
}
.admin-skeleton__line--label { width: 38%; height: 12px; }
.admin-skeleton__line--value { width: 72%; height: 16px; margin-top: 10px; }
@keyframes admin-skeleton-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}
</style>
