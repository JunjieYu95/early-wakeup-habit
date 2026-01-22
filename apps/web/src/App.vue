<template>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="h1">Early Wakeup Tracker</h1>
        <p class="sub">Check in daily, add one photo, and watch your streaks grow.</p>
      </div>
      <div class="row">
        <span class="pill">View</span>
        <button class="btn" :class="{primary: view==='calendar'}" @click="view='calendar'">Calendar</button>
        <button class="btn" :class="{primary: view==='timeline'}" @click="view='timeline'">Timeline</button>
      </div>
    </div>

    <SummaryBar
      :records="records"
      :monthCursor="monthCursor"
      @jumpToday="jumpToday"
    />

    <div class="grid">
      <div class="card">
        <div class="row" style="align-items:flex-start;">
          <div class="spacer">
            <div class="row" style="gap:10px;">
              <button class="btn" @click="prevMonth">‹</button>
              <div>
                <div style="font-size:16px; font-weight:600;">{{ monthTitle }}</div>
                <div class="mini">Click a day to check-in and attach one photo.</div>
              </div>
              <button class="btn" @click="nextMonth">›</button>
            </div>
          </div>

          <button class="btn" @click="jumpToday">Today</button>
        </div>

        <div class="hr"></div>

        <CalendarView
          v-if="view==='calendar'"
          :monthCursor="monthCursor"
          :recordMap="recordMap"
          :selectedDate="selectedDate"
          @select="onSelect"
        />

        <TimelineView
          v-else
          :records="records"
          :selectedDate="selectedDate"
          @select="onSelect"
        />
      </div>

      <div class="card">
        <CheckInPanel
          :selectedDate="selectedDate"
          :record="selectedRecord"
          @saved="refresh"
          @deleted="onDeleted"
          @toast="toast"
        />
      </div>
    </div>

    <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { getRecords } from "./lib/api.js";
import { ymd } from "./lib/date.js";

import CalendarView from "./components/CalendarView.vue";
import TimelineView from "./components/TimelineView.vue";
import CheckInPanel from "./components/CheckInPanel.vue";
import SummaryBar from "./components/SummaryBar.vue";

const view = ref("calendar");
const monthCursor = ref(new Date());
const records = ref([]);
const selectedDate = ref(ymd(new Date()));
const toastMsg = ref("");

const monthTitle = computed(() => format(monthCursor.value, "MMMM yyyy"));

const recordMap = computed(() => {
  const m = new Map();
  for (const r of records.value) m.set(r.date, r);
  return m;
});

const selectedRecord = computed(() => recordMap.value.get(selectedDate.value) || null);

function toast(msg) {
  toastMsg.value = msg;
  setTimeout(() => { toastMsg.value = ""; }, 2400);
}

async function refresh() {
  const from = ymd(startOfMonth(monthCursor.value));
  const to = ymd(endOfMonth(monthCursor.value));
  records.value = await getRecords(from, to);
}

function onSelect(date) {
  selectedDate.value = date;
}

function prevMonth() {
  monthCursor.value = addMonths(monthCursor.value, -1);
  refresh();
}

function nextMonth() {
  monthCursor.value = addMonths(monthCursor.value, 1);
  refresh();
}

function jumpToday() {
  monthCursor.value = new Date();
  selectedDate.value = ymd(new Date());
  refresh();
}

function onDeleted(date) {
  // optimistic remove
  records.value = records.value.filter(r => r.date !== date);
  toast("Deleted record.");
}

onMounted(async () => {
  await refresh();
});
</script>
