<template>
  <div>
    <div class="cal-head">
      <div v-for="d in labels" :key="d" class="cal-label">{{ d }}</div>
    </div>

    <div class="cal-grid">
      <button
        v-for="day in days"
        :key="day.toISOString()"
        class="cal-cell"
        :class="cellClass(day)"
        @click="$emit('select', ymd(day))"
      >
        <div class="cal-top">
          <span class="cal-num">{{ day.getDate() }}</span>
          <span v-if="hasRecord(ymd(day))" class="dot" :class="{ok: isChecked(ymd(day))}"></span>
        </div>

        <div v-if="thumbUrl(ymd(day))" class="thumb">
          <img :src="thumbUrl(ymd(day))" alt="thumb" loading="lazy" />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { buildMonthGrid, isInMonth, isToday, ymd } from "../lib/date.js";

const props = defineProps({
  monthCursor: { type: Date, required: true },
  recordMap: { type: Object, required: true }, // Map
  selectedDate: { type: String, required: true }
});

defineEmits(["select"]);

const labels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const days = computed(() => buildMonthGrid(props.monthCursor, 1));

function hasRecord(date) {
  return props.recordMap?.has?.(date);
}
function getRecord(date) {
  return props.recordMap.get(date);
}
function isChecked(date) {
  const r = getRecord(date);
  return !!(r && (r.checked === 1 || r.checked === true));
}
function thumbUrl(date) {
  const r = getRecord(date);
  return r?.imageUrl || null;
}
function cellClass(day) {
  const date = ymd(day);
  return {
    muted: !isInMonth(day, props.monthCursor),
    today: isToday(day),
    selected: date === props.selectedDate,
    checked: isChecked(date)
  };
}
</script>

<style scoped>
.cal-head{
  display:grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}
.cal-label{
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  padding: 6px 0;
}
.cal-grid{
  display:grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.cal-cell{
  border: 1px solid var(--border);
  background: rgba(0,0,0,0.15);
  border-radius: 14px;
  padding: 10px 10px 8px;
  color: var(--text);
  text-align:left;
  cursor:pointer;
  min-height: 92px;
  position: relative;
  overflow:hidden;
  transition: background .2s ease, border-color .2s ease, transform .08s ease;
}
.cal-cell:hover{ background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.18); }
.cal-cell:active{ transform: translateY(1px); }
.cal-cell.muted{ opacity: 0.45; }
.cal-cell.today{ outline: 2px solid rgba(139,211,255,0.35); }
.cal-cell.selected{ border-color: rgba(139,211,255,0.55); background: rgba(139,211,255,0.10); }
.cal-cell.checked{ background: rgba(157,243,196,0.08); border-color: rgba(157,243,196,0.25); }

.cal-top{ display:flex; align-items:center; justify-content:space-between; }
.cal-num{ font-size: 13px; color: rgba(232,236,255,0.95); }

.dot{
  width:8px; height:8px; border-radius:999px;
  border: 1px solid rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.14);
}
.dot.ok{
  border-color: rgba(157,243,196,0.45);
  background: rgba(157,243,196,0.55);
}

.thumb{
  margin-top: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.10);
  overflow:hidden;
  height: 46px;
}
.thumb img{
  width:100%;
  height:100%;
  object-fit: cover;
  display:block;
  filter: saturate(1.05) contrast(1.05);
}
</style>
