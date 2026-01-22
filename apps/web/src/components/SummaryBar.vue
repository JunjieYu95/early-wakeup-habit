<template>
  <div class="card" style="margin-bottom:14px;">
    <div class="row">
      <div class="pill">
        <span style="color:var(--muted);">Month checked:</span>
        <strong style="color:var(--text);">{{ checkedCount }}</strong>
        <span style="color:var(--muted);">/ {{ totalDays }}</span>
      </div>

      <div class="pill">
        <span style="color:var(--muted);">Current streak:</span>
        <strong style="color:var(--text);">{{ streak }}</strong>
        <span style="color:var(--muted);">day(s)</span>
      </div>

      <div class="spacer"></div>

      <button class="btn" @click="$emit('jumpToday')">Jump to today</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

const props = defineProps({
  records: { type: Array, required: true },
  monthCursor: { type: Date, required: true }
});
defineEmits(["jumpToday"]);

const map = computed(() => {
  const m = new Map();
  for (const r of props.records) m.set(r.date, r);
  return m;
});

function isChecked(r){
  return !!(r && (r.checked===1 || r.checked===true));
}

const days = computed(() => eachDayOfInterval({ start: startOfMonth(props.monthCursor), end: endOfMonth(props.monthCursor) }));
const totalDays = computed(() => days.value.length);

const checkedCount = computed(() => {
  let c = 0;
  for (const d of days.value){
    const key = format(d, "yyyy-MM-dd");
    if (isChecked(map.value.get(key))) c++;
  }
  return c;
});

const streak = computed(() => {
  // streak up to today, walking backwards while checked
  const today = new Date();
  let s = 0;
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (true){
    const key = format(cursor, "yyyy-MM-dd");
    const r = map.value.get(key);
    if (!isChecked(r)) break;
    s++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return s;
});
</script>
