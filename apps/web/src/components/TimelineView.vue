<template>
  <div class="timeline">
    <div v-if="sorted.length===0" class="mini">No records in this range yet. Select a day and create your first check-in.</div>

    <button
      v-for="r in sorted"
      :key="r.date"
      class="item"
      :class="{selected: r.date===selectedDate, checked: isChecked(r)}"
      @click="$emit('select', r.date)"
    >
      <div class="left">
        <div class="date">{{ r.date }}</div>
        <div class="mini">{{ isChecked(r) ? "Checked in" : "Not checked" }} <span v-if="r.note">• {{ r.note }}</span></div>
      </div>
      <div class="right">
        <div v-if="r.imageUrl" class="thumb"><img :src="r.imageUrl" alt="img" loading="lazy"/></div>
        <div class="badge" :class="{ok: isChecked(r)}">{{ isChecked(r) ? "✓" : "—" }}</div>
      </div>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  records: { type: Array, required: true },
  selectedDate: { type: String, required: true }
});
defineEmits(["select"]);

const sorted = computed(() =>
  [...props.records].sort((a,b) => (a.date < b.date ? 1 : -1))
);

function isChecked(r){
  return !!(r && (r.checked===1 || r.checked===true));
}
</script>

<style scoped>
.timeline{ display:flex; flex-direction:column; gap:10px; }
.item{
  width: 100%;
  text-align:left;
  border: 1px solid var(--border);
  background: rgba(0,0,0,0.15);
  border-radius: 16px;
  padding: 12px;
  color: var(--text);
  cursor:pointer;
  transition: background .2s ease, border-color .2s ease, transform .08s ease;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
}
.item:hover{ background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.18); }
.item:active{ transform: translateY(1px); }
.item.selected{ border-color: rgba(139,211,255,0.55); background: rgba(139,211,255,0.10); }
.item.checked{ background: rgba(157,243,196,0.08); border-color: rgba(157,243,196,0.25); }

.left .date{ font-weight: 700; font-size: 14px; letter-spacing:0.2px; }
.right{ display:flex; align-items:center; gap:10px; }
.thumb{
  width: 54px; height: 36px;
  border-radius: 12px; overflow:hidden;
  border: 1px solid rgba(255,255,255,0.10);
}
.thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
.badge{
  width: 34px; height: 34px;
  border-radius: 12px;
  display:grid; place-items:center;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  font-weight: 800;
}
.badge.ok{
  border-color: rgba(157,243,196,0.35);
  background: rgba(157,243,196,0.18);
}
</style>
