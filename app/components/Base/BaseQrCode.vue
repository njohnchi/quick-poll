<script setup lang="ts">
import QRCode from 'qrcode'

/**
 * Renders a QR code image for the provided value.
 * Props:
 * - value: string to encode
 * - size: optional pixel size (default 160)
 */
const props = defineProps<{ value: string; size?: number }>()
const dataUrl = ref<string>('')

onMounted(async () => {
  dataUrl.value = await QRCode.toDataURL(props.value, { width: props.size ?? 160, margin: 1 })
})
</script>

<template>
  <img v-if="dataUrl" :src="dataUrl" :width="props.size || 160" :height="props.size || 160" alt="QR code" />
</template>
