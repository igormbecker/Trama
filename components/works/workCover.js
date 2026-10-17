const colors = [
  "#403b87",
  "#2e6262",
  "#7b433e",
  "#45613f",
  "#6a4570",
  "#71542e",
];

export function getWorkCoverColor(workId) {
  let hash = 0;
  for (const character of workId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return colors[hash % colors.length];
}
