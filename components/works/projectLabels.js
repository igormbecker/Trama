const literary = {
  type: "Obra literária",
  name: "obra",
  title: "Obra",
  definite: "a obra",
  thisProject: "Esta obra",
  private: "Obra privada",
  back: "Voltar à obra",
  chapter: "capítulo",
  chapters: "capítulos",
  chapterTitle: "Capítulo",
  thisChapter: "Este capítulo",
  definiteChapter: "o capítulo",
  inChapter: "no capítulo",
  inChapters: "nos capítulos",
};
const groupAssignment = {
  type: "Trabalho em grupo",
  name: "trabalho",
  title: "Trabalho",
  definite: "o trabalho",
  thisProject: "Este trabalho",
  private: "Trabalho privado",
  back: "Voltar ao trabalho",
  chapter: "seção",
  chapters: "seções",
  chapterTitle: "Seção",
  thisChapter: "Esta seção",
  definiteChapter: "a seção",
  inChapter: "na seção",
  inChapters: "nas seções",
};
export function getProjectLabels(type) {
  return type === "group_assignment" ? groupAssignment : literary;
}
export function filterProjects(works, type) {
  return type === "all"
    ? works
    : works.filter((work) => (work.type || "literary") === type);
}
