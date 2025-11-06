export const showVideoModal = $state({
  open: false
});

export function openVideoModal() {
  showVideoModal.open = true;
}

export function closeVideoModal() {
  showVideoModal.open = false;
}

export const showShareModal = $state({
  open: false
});

export function openShareModal() {
  showShareModal.open = true;
}

export function closeShareModal() {
  showShareModal.open = false;
}