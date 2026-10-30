export function prepareAudioPreview(player, audio, urlApi = URL) {
  const url = urlApi.createObjectURL(audio);
  function startAtBeginning() {
    player.currentTime = 0;
  }
  player.addEventListener("loadedmetadata", startAtBeginning, { once: true });
  player.preload = "auto";
  player.src = url;
  // Explicitly initialize the new Blob source before the first user playback.
  player.load();
  return () => {
    player.removeEventListener("loadedmetadata", startAtBeginning);
    player.pause();
    player.removeAttribute("src");
    player.load();
    urlApi.revokeObjectURL(url);
  };
}
