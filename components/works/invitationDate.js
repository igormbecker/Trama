export function formatInvitationDate(value) {
  const date = new Date(value);
  const timeZone = "America/Sao_Paulo";
  const day = date.toLocaleDateString("pt-BR", { timeZone });
  const time = date.toLocaleTimeString("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return `${day} às ${time}`;
}
