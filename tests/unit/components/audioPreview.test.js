import { prepareAudioPreview } from "components/voice/audioPreview";

function setup() {
  const player = new EventTarget();
  player.currentTime = 12;
  player.load = jest.fn();
  player.pause = jest.fn();
  player.play = jest.fn();
  player.removeAttribute = jest.fn();
  const urlApi = {
    createObjectURL: jest.fn(() => "blob:recording"),
    revokeObjectURL: jest.fn(),
  };
  const audio = new Blob(["synthetic audio"]);
  return { player, urlApi, audio };
}
test("Explicitly loads a new recording and positions the first playback at the start", () => {
  const { player, urlApi, audio } = setup();
  prepareAudioPreview(player, audio, urlApi);
  expect(player.src).toBe("blob:recording");
  expect(player.preload).toBe("auto");
  expect(player.load).toHaveBeenCalledTimes(1);
  player.dispatchEvent(new Event("loadedmetadata"));
  expect(player.currentTime).toBe(0);
  expect(player.play).not.toHaveBeenCalled();
});
test("Does not reset user seeking after initial preparation and releases the source on cleanup", () => {
  const { player, urlApi, audio } = setup();
  const cleanup = prepareAudioPreview(player, audio, urlApi);
  player.dispatchEvent(new Event("loadedmetadata"));
  player.currentTime = 7;
  player.dispatchEvent(new Event("loadedmetadata"));
  expect(player.currentTime).toBe(7);
  cleanup();
  expect(player.pause).toHaveBeenCalledTimes(1);
  expect(player.removeAttribute).toHaveBeenCalledWith("src");
  expect(player.load).toHaveBeenCalledTimes(2);
  expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:recording");
});
