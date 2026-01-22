<template>
  <div>
    <div class="row">
      <div>
        <div style="font-size:16px; font-weight:700;">Check-in</div>
        <div class="mini">Date: <span style="color:var(--text); font-weight:600;">{{ selectedDate }}</span></div>
      </div>
      <div class="spacer"></div>
      <button class="btn danger" v-if="record" @click="onDelete">Delete</button>
    </div>

    <div class="hr"></div>

    <div class="row" style="align-items:flex-start;">
      <label class="pill" style="user-select:none;">
        <input type="checkbox" v-model="checked" />
        Woke up early
      </label>
      <div class="spacer"></div>
      <button class="btn primary" :disabled="saving" @click="onSave">{{ saving ? "Saving..." : "Save" }}</button>
    </div>

    <div style="margin-top:12px;">
      <div class="mini" style="margin-bottom:6px;">Optional note</div>
      <textarea class="textarea" v-model="note" placeholder="e.g., 6:10am, felt great, short run after."></textarea>
    </div>

    <div style="margin-top:12px;">
      <div class="row">
        <div class="mini">One photo per day (stored in Cloudinary)</div>
        <div class="spacer"></div>
        <button v-if="imageUrl" class="btn" @click="clearImage">Remove photo</button>
      </div>

      <div class="uploader">
        <input class="input" type="file" accept="image/*" @change="onPick" />
        <div class="mini" v-if="uploading">Uploading...</div>
      </div>

      <div v-if="imageUrl" class="preview">
        <img :src="imageUrl" alt="preview" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { deleteRecord, patchRecord, upsertRecord, uploadToCloudinary } from "../lib/api.js";

const props = defineProps({
  selectedDate: { type: String, required: true },
  record: { type: Object, default: null }
});

const emit = defineEmits(["saved","deleted","toast"]);

const checked = ref(false);
const note = ref("");
const imageUrl = ref("");
const imagePublicId = ref("");

const saving = ref(false);
const uploading = ref(false);

watch(() => props.record, (r) => {
  checked.value = !!(r && (r.checked===1 || r.checked===true));
  note.value = r?.note || "";
  imageUrl.value = r?.imageUrl || "";
  imagePublicId.value = r?.imagePublicId || "";
}, { immediate:true });

watch(() => props.selectedDate, () => {
  // if date changes but record doesn't exist, reset
  if (!props.record) {
    checked.value = false;
    note.value = "";
    imageUrl.value = "";
    imagePublicId.value = "";
  }
});

function clearImage(){
  imageUrl.value = "";
  imagePublicId.value = "";
  emit("toast", "Photo removed (remember to Save).");
}

async function onPick(e){
  const file = e.target.files?.[0];
  if (!file) return;
  uploading.value = true;
  try{
    const up = await uploadToCloudinary(file);
    imageUrl.value = up.imageUrl;
    imagePublicId.value = up.imagePublicId;
    emit("toast", "Uploaded photo. Saving...");
    // Auto-save after upload
    await onSave();
  }catch(err){
    emit("toast", err?.message || "Upload failed.");
  }finally{
    uploading.value = false;
    e.target.value = "";
  }
}

async function onSave(){
  saving.value = true;
  try{
    const payload = {
      date: props.selectedDate,
      checked: checked.value,
      imageUrl: imageUrl.value || null,
      imagePublicId: imagePublicId.value || null,
      note: note.value || null
    };

    // upsert keeps the API simple
    await upsertRecord(payload);
    emit("toast", "Saved.");
    emit("saved");
  }catch(err){
    console.error("Save error:", err);
    const message = err?.response?.data?.error || err?.message || "Save failed. Check if the API server is running.";
    emit("toast", message);
  }finally{
    saving.value = false;
  }
}

async function onDelete(){
  if (!confirm("Delete this record?")) return;
  try{
    await deleteRecord(props.selectedDate);
    emit("deleted", props.selectedDate);
    emit("toast", "Deleted.");
  }catch(err){
    emit("toast", err?.message || "Delete failed.");
  }
}
</script>

<style scoped>
.uploader{
  margin-top: 10px;
  display:flex;
  flex-direction:column;
  gap: 8px;
}
.preview{
  margin-top: 10px;
  border-radius: 16px;
  overflow:hidden;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.2);
}
.preview img{
  width:100%;
  display:block;
  max-height: 260px;
  object-fit: cover;
}
</style>
