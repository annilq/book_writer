import i18n from "./i18n";

export const SUGGESTED_PROMPTS = [
  {
    title: i18n.t("bookTitle1"),
    description: i18n.t("bookDesc1"),
    model:"deepseek/deepseek-reasoner",
    categories: "HISTORY",
  },
  {
    title: i18n.t("bookTitle2"),
    description: i18n.t("bookDesc2"),
    model:"ollama/llama3.2:latest",
    categories: "EDUCATION",
  },
  {
    title: i18n.t("bookTitle3"),
    description: i18n.t("bookDesc3"),
    model:"ollama/llama3.2:latest",
    categories: "BIOGRAPHY",
  },
];
