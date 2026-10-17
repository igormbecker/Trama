export async function runManualSave(save, showSaving) {
  showSaving(true);
  const feedback = new Promise((resolve) => setTimeout(resolve, 400));
  try {
    return await save();
  } finally {
    await feedback;
    showSaving(false);
  }
}
